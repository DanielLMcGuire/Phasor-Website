import cluster from 'cluster';
import http, { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import crypto from 'crypto';
import path from 'path';
import zlib from 'zlib';
import mimeTypes from '../server-mimetypes.json' with { type: 'json' };

const portArg = process.argv[2];
const port: number | undefined = portArg ? parseInt(portArg, 10) : undefined;

const logging  = process.argv.includes('-l')    || process.argv.includes('--log');
const help     = process.argv.includes('-h')    || process.argv.includes('--help');
const isDev    = process.argv.includes('--dev');
const devTools =
    process.argv.includes('-dt')        ||
    process.argv.includes('--devtools') ||
    process.argv.includes('--chrome');

const hostRootArgIdx = process.argv.indexOf('--root') !== -1 ? process.argv.indexOf('--root') : process.argv.indexOf('-r');
const hostRootArg    = hostRootArgIdx !== -1 ? process.argv[hostRootArgIdx + 1] : undefined;

function printHelp(ret: number): never {
    console.log('Usage: node server.js [port] [options]');
    console.log('Options:');
    console.log('  -r, --root <dir> Set the host root directory (default: working dir)');
    console.log('  -l, --log       Enable request logging');
    console.log('  --dev           Dev mode: exit on exception instead of restarting');
    console.log('  -dt, --devtools Enable Chrome DevTools workspace');
    console.log('  -h, --help      Show this help message');
    process.exit(ret);
}

if (help) printHelp(0);

if (!port || Number.isNaN(port)) {
    console.error('Error: port must be a number (first argument)');
    printHelp(1);
}

if (hostRootArgIdx !== -1 && !hostRootArg) {
    console.error('Error: --root requires a directory argument');
    printHelp(1);
}

if (cluster.isPrimary && !isDev) {
    let shuttingDown = false;

    function spawnWorker(): void {
        const worker = cluster.fork();
        worker.on('exit', (code, signal) => {
            if (shuttingDown) return;
            if (signal === 'SIGINT' || signal === 'SIGTERM') return;
            console.error(
                `[primary] Worker ${worker.process.pid} exited` +
                ` (code=${code ?? '—'}, signal=${signal ?? '—'}), restarting in 500 ms…`
            );
            setTimeout(spawnWorker, 500);
        });
    }

    spawnWorker();

    let forcedExit = false;
    process.on('SIGINT', () => {
        if (forcedExit) { process.exit(0); }
        forcedExit   = true;
        shuttingDown = true;
        console.log('[primary] Shutting down (Ctrl-C again to force)…');
        for (const w of Object.values(cluster.workers ?? {})) {
            w?.process.kill('SIGINT');
        }
    });

} else {

type CachedBuffer = {
    buffer: Buffer;
    gzipped: Buffer | null;
    contentType: string;
    etag: string;
    lastModified: string;
    cachedAt: number;
};

type CachedStream = {
    path: string;
    size: number;
    contentType: string;
    etag: string;
    lastModified: string;
    cachedAt: number;
};

type CachedFile = CachedBuffer | CachedStream;

const ROOT               = hostRootArg ? path.resolve(hostRootArg) : process.cwd();
const MAX_CACHE_SIZE     = 8_112 * 1024; // ~8 MB — buffer files smaller than this
const CACHE_TTL_MS       = 20_000;       // evict entries after 20 s
const REQUEST_TIMEOUT_MS = 30_000;       // abort stalled requests after 30 s
const HEADERS_TIMEOUT_MS = 10_000;       // abort connections that never send headers

const fileCache = new Map<string, CachedFile>();

const devToolsUUID   = crypto.randomUUID();
let devToolsMsgShown = false;
let forcedExit       = false;

setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of fileCache) {
        if (now - entry.cachedAt >= CACHE_TTL_MS) {
            fileCache.delete(key);
            if (logging) console.log(`Server: Cache pruned ${path.relative(ROOT, key)}`);
        }
    }
}, CACHE_TTL_MS).unref();

function isCompressible(ext: string): boolean {
    return /\.(html|css|js|mjs|json|txt|svg|xml)$/.test(ext);
}

function getFilePath(url?: string): string | null {
    const raw = !url || url === '/' ? '/index.html' : url.split('?')[0];

    let decoded: string;
    try {
        decoded = decodeURIComponent(raw);
    } catch {
        return null;
    }

    const resolved = path.resolve(ROOT, '.' + decoded);

    if (resolved !== ROOT && !resolved.startsWith(ROOT + path.sep)) {
        return null;
    }

    return resolved;
}

function logCacheUsage(action: string, filepath: string): void {
    let used = 0;
    for (const v of fileCache.values()) {
        if ('buffer' in v) used += v.buffer.length;
    }
    const pct = ((used / MAX_CACHE_SIZE) * 100).toFixed(1);
    console.log(`Server: ${action} ${path.relative(ROOT, filepath)}`);
    console.log(
        `Server: Cache ${(used / 1_000).toFixed(1)} KB` +
        `/${(MAX_CACHE_SIZE / 1_000).toFixed(1)} KB (${pct}%)`
    );
}

function gzipAsync(buf: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) =>
        zlib.gzip(buf, { level: zlib.constants.Z_DEFAULT_COMPRESSION }, (err, out) =>
            err ? reject(err) : resolve(out)
        )
    );
}

function cacheControlFor(ext: string): string {
    return ext === '.html' ? 'no-cache' : 'public, max-age=3600, must-revalidate';
}

type ByteRange = { start: number; end: number };

function parseRange(header: string, totalSize: number): ByteRange | 'invalid' {
    if (header.includes(',')) return 'invalid';

    const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
    if (!m) return 'invalid';

    const hasStart = m[1] !== '';
    const hasEnd   = m[2] !== '';

    if (!hasStart && !hasEnd) return 'invalid';

    let start: number;
    let end: number;

    if (!hasStart) {
        const suffix = parseInt(m[2], 10);
        start = Math.max(0, totalSize - suffix);
        end   = totalSize - 1;
    } else {
        start = parseInt(m[1], 10);
        end   = hasEnd ? parseInt(m[2], 10) : totalSize - 1;
    }

    end = Math.min(end, totalSize - 1);
    if (start > end || start >= totalSize) return 'invalid';

    return { start, end };
}

const ATTACHMENT_EXTS = new Set([
    '.exe', '.msi', '.dmg', '.pkg', '.deb', '.rpm', '.apk', '.ipa',
    '.zip', '.tar', '.gz', '.tgz', '.bz2', '.xz', '.7z', '.rar', '.zst',
    '.iso', '.img', '.bin', '.jar', '.war', '.ear',
    '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.odt', '.ods', '.odp',
]);

function isAttachment(ext: string): boolean {
    return ATTACHMENT_EXTS.has(ext.toLowerCase());
}

async function getFile(filepath: string): Promise<CachedFile | null> {
    const cached = fileCache.get(filepath);

    if (cached) {
        if (Date.now() - cached.cachedAt < CACHE_TTL_MS) {
            if (logging) logCacheUsage('Cache hit', filepath);
            return cached;
        }
        fileCache.delete(filepath);
        if (logging) console.log(`Server: Cache expired ${path.relative(ROOT, filepath)}`);
    }

    try {
        const stats = await fs.promises.stat(filepath);
        if (!stats.isFile()) return null;

        const ext          = path.extname(filepath);
        const contentType  = (mimeTypes as Record<string, string>)[ext] ?? 'application/octet-stream';
        const lastModified = stats.mtime.toUTCString();

        if (stats.size <= MAX_CACHE_SIZE) {
            const buffer  = await fs.promises.readFile(filepath);
            const etag    = `"${crypto.createHash('sha1').update(buffer).digest('hex')}"`;
            const gzipped = isCompressible(ext) ? await gzipAsync(buffer) : null;

            const data: CachedBuffer = { buffer, gzipped, contentType, etag, lastModified, cachedAt: Date.now() };
            fileCache.set(filepath, data);
            if (logging) logCacheUsage('Added', filepath);
            return data;
        }

        const etag = `"${stats.mtimeMs.toString(36)}-${stats.size.toString(36)}"`;
        return { path: filepath, size: stats.size, contentType, etag, lastModified, cachedAt: Date.now() };

    } catch {
        return null;
    }
}

function handleDevTools(req: IncomingMessage, res: ServerResponse, method: string): void {
    const payload = zlib.gzipSync(
        JSON.stringify({ workspace: { root: ROOT, uuid: devToolsUUID } })
    );
    res.writeHead(200, {
        'Content-Type':     'application/json',
        'Content-Encoding': 'gzip',
        'Content-Length':    payload.byteLength,
    });
    if (method !== 'HEAD') res.end(payload);
    else res.end();

    if (!devToolsMsgShown) {
        console.log('DevTools: Go to Sources → Workspace and click "Connect"');
        devToolsMsgShown = true;
    } else if (logging) {
        console.log('DevTools: Workspace re-initialised');
    }
}

function serveBufferFile(
    req: IncomingMessage,
    res: ServerResponse,
    fileData: CachedBuffer,
    baseHeaders: Record<string, string | number>,
    method: string,
    rangeHeader: string | undefined,
    honorRange: boolean,
    acceptsGzip: boolean,
): void {
    const totalSize = fileData.buffer.byteLength;

    if (honorRange) {
        const range = parseRange(rangeHeader!, totalSize);
        if (range === 'invalid') {
            res.writeHead(416, { 'Content-Range': `bytes */${totalSize}`, 'Content-Type': 'text/plain' });
            res.end('416 Range Not Satisfiable');
            if (logging) console.log(`Server: 416 ${req.url}`);
            return;
        }
        const { start, end } = range;
        const body = fileData.buffer.subarray(start, end + 1);
        res.writeHead(206, {
            ...baseHeaders,
            'Content-Range':  `bytes ${start}-${end}/${totalSize}`,
            'Content-Length': body.byteLength,
        });
        if (method !== 'HEAD') res.end(body);
        else res.end();
    } else if (acceptsGzip && fileData.gzipped) {
        const body = fileData.gzipped;
        res.writeHead(200, { ...baseHeaders, 'Content-Encoding': 'gzip', 'Content-Length': body.byteLength });
        if (method !== 'HEAD') res.end(body);
        else res.end();
    } else {
        const body = fileData.buffer;
        res.writeHead(200, { ...baseHeaders, 'Content-Length': body.byteLength });
        if (method !== 'HEAD') res.end(body);
        else res.end();
    }
}

function serveStreamFile(
    req: IncomingMessage,
    res: ServerResponse,
    fileData: CachedStream,
    baseHeaders: Record<string, string | number>,
    method: string,
    ext: string,
    rangeHeader: string | undefined,
    honorRange: boolean,
    acceptsGzip: boolean,
): void {
    const totalSize = fileData.size;

    if (honorRange) {
        const range = parseRange(rangeHeader!, totalSize);
        if (range === 'invalid') {
            res.writeHead(416, { 'Content-Range': `bytes */${totalSize}`, 'Content-Type': 'text/plain' });
            res.end('416 Range Not Satisfiable');
            if (logging) console.log(`Server: 416 ${req.url}`);
            return;
        }
        const { start, end } = range;
        res.writeHead(206, {
            ...baseHeaders,
            'Content-Range':  `bytes ${start}-${end}/${totalSize}`,
            'Content-Length': end - start + 1,
        });
        if (method === 'HEAD') { res.end(); return; }
        const fileStream = fs.createReadStream(fileData.path, { start, end });
        fileStream.on('error', () => {
            if (!res.headersSent) res.statusCode = 500;
            res.end('Internal Server Error');
        });
        fileStream.pipe(res);
    } else if (method === 'HEAD') {
        res.writeHead(200, baseHeaders);
        res.end();
    } else if (acceptsGzip && isCompressible(ext)) {
        const compressStart = logging ? process.hrtime.bigint() : undefined;
        res.writeHead(200, { ...baseHeaders, 'Content-Encoding': 'gzip' });

        const gzip       = zlib.createGzip();
        const fileStream = fs.createReadStream(fileData.path);

        const onError = () => {
            if (!res.headersSent) res.statusCode = 500;
            res.end('Internal Server Error');
        };
        gzip.on('error', onError);
        fileStream.on('error', onError);
        gzip.on('finish', () => {
            if (logging && compressStart) {
                const ms = Number(process.hrtime.bigint() - compressStart) / 1e6;
                console.log(`Server: Compressed ${path.relative(ROOT, fileData.path)} in ${ms.toFixed(3)}ms`);
            }
        });

        fileStream.pipe(gzip).pipe(res);
    } else {
        res.writeHead(200, baseHeaders);
        const fileStream = fs.createReadStream(fileData.path);
        fileStream.on('error', () => {
            if (!res.headersSent) res.statusCode = 500;
            res.end('Internal Server Error');
        });
        fileStream.pipe(res);
    }
}

async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    let start: bigint | undefined;
    let timerName = '';

    if (logging) {
        console.log(`Client: ${req.method} ${req.url}`);
        start     = process.hrtime.bigint();
        timerName = `Server: ${req.method} ${req.url}`;
    }

    const method = req.method ?? 'GET';

    if (method !== 'GET' && method !== 'HEAD') {
        res.writeHead(405, { Allow: 'GET, HEAD' });
        res.end();
        return;
    }

    if (devTools && req.url?.split('?')[0].endsWith('/.well-known/appspecific/com.chrome.devtools.json')) {
        handleDevTools(req, res, method);
        return;
    }

    const filepath = getFilePath(req.url);

    if (!filepath) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('400 Bad Request');
        if (logging) console.log(`Server: 400 (traversal/bad URL) ${req.url}`);
        return;
    }

    const fileData = await getFile(filepath);

    if (!fileData) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        if (logging) console.log(`Server: 404 ${req.url}`);
        return;
    }

    if (logging) console.log(`Server: Serving ${path.relative(ROOT, filepath)}`);

    const ext            = path.extname(filepath);
    const clientEtag     = req.headers['if-none-match'];
    const clientModified = req.headers['if-modified-since'];

    const etagMatch     = clientEtag && clientEtag === fileData.etag;
    const modifiedMatch = !clientEtag && clientModified &&
        new Date(clientModified) >= new Date(fileData.lastModified);

    if (etagMatch || modifiedMatch) {
        res.writeHead(304, {
            'ETag':          fileData.etag,
            'Last-Modified': fileData.lastModified,
            'Cache-Control': cacheControlFor(ext),
        });
        res.end();
        if (logging) console.log(`Server: 304 ${req.url}`);
        return;
    }

    const baseHeaders: Record<string, string | number> = {
        'Content-Type':   fileData.contentType,
        'ETag':           fileData.etag,
        'Last-Modified':  fileData.lastModified,
        'Cache-Control':  cacheControlFor(ext),
        'Accept-Ranges':  'bytes',
    };

    if (isAttachment(ext)) {
        const filename = encodeURIComponent(path.basename(filepath));
        baseHeaders['Content-Disposition'] = `attachment; filename="${filename}"; filename*=UTF-8''${filename}`;
    }

    const rangeHeader = req.headers['range'];
    const ifRange     = req.headers['if-range'];
    const honorRange  = !!rangeHeader && (!ifRange || ifRange === fileData.etag);
    const acceptsGzip = req.headers['accept-encoding']?.includes('gzip') ?? false;

    if ('buffer' in fileData) {
        serveBufferFile(req, res, fileData, baseHeaders, method, rangeHeader, honorRange, acceptsGzip);
    } else {
        serveStreamFile(req, res, fileData, baseHeaders, method, ext, rangeHeader, honorRange, acceptsGzip);
    }

    res.on('finish', () => {
        if (!logging || !start) return;
        const ms = Number(process.hrtime.bigint() - start) / 1e6;
        console.log(`${timerName} ${ms.toFixed(3)}ms`);
    });
}

const server = http.createServer(handleRequest);

server.headersTimeout = HEADERS_TIMEOUT_MS;
server.requestTimeout = REQUEST_TIMEOUT_MS;

server.listen(port, () => {
    const tag = isDev ? ' [dev]' : '';
    console.log(
        port !== 80
            ? `Server running at http://localhost:${port}/${tag}`
            : `Server running at http://localhost/${tag}`
    );
});

process.on('SIGINT', () => {
    if (forcedExit) { console.log('Force exiting…'); process.exit(0); }
    console.log('Shutting down gracefully… (Ctrl-C again to force)');
    forcedExit = true;
    server.close(() => { console.log('Server stopped'); process.exit(0); });
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection:', reason);
    process.exit(1);
});

process.on('warning', (w) => console.warn('Warning:', w));

}
