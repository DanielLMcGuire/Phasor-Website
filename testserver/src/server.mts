import http, { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import crypto from 'crypto';
import path from 'path';
import zlib from 'zlib';
import mimeTypes from '../server-mimetypes.json' with { type: 'json' };

type CachedFile =
    | { buffer: Buffer; contentType: string; cachedAt: number }
    | { path: string; contentType: string; cachedAt: number };

const portArg = process.argv[2];
const port: number | undefined = portArg ? parseInt(portArg, 10) : undefined;

const logging = process.argv.includes('-l') || process.argv.includes('--log');
const help = process.argv.includes('-h') || process.argv.includes('--help');
const devTools =
    process.argv.includes('-dt') ||
    process.argv.includes('--devtools') ||
    process.argv.includes('--chrome');

const MAX_CACHE_SIZE = 8112 * 1024; // ~8MB
const CACHE_TTL_MS = 20_000; // 20 seconds
const fileCache = new Map<string, CachedFile>();

let devToolsMsg = logging;

let forcedExit = false;

if (help) printHelp(0);

function printHelp(ret: number): never {
    console.log('Usage: node server.js [port] [options]');
    console.log('Options:');
    console.log('  -l, --log       Enable logging');
    console.log('  -dt, --devtools Enable DevTools');
    console.log('  -h, --help      Show this help message');
    process.exit(ret);
}

function shouldCompress(ext: string): boolean {
    return /\.(html|css|js|json|txt)$/.test(ext);
}

function getFilePath(url?: string): string {
    const pathname = !url || url === '/' ? '/index.html' : url.split('?')[0];
    return path.join(process.cwd(), pathname);
}

function logCacheUsage(action: string, filepath: string) {
    let used = 0;
    for (const v of fileCache.values()) {
        if ('buffer' in v) used += v.buffer.length;
    }
    const percent = ((used / MAX_CACHE_SIZE) * 100).toFixed(1);
    console.log(`Server: ${action} ${path.relative(process.cwd(), filepath)}`);
    console.log(
        `Server: Cache ${(used / 1000).toFixed(1)}KB/${(MAX_CACHE_SIZE / 1000).toFixed(1)}KB, ${percent}%`
    );
}

async function getFile(filepath: string): Promise<CachedFile | null> {
    const cached = fileCache.get(filepath);

    if (cached) {
        if (Date.now() - cached.cachedAt < CACHE_TTL_MS) {
            if (logging) logCacheUsage('Cache hit', filepath);
            return cached;
        }
        fileCache.delete(filepath);
        if (logging) console.log(`Server: Cache expired ${path.relative(process.cwd(), filepath)}`);
    }

    try {
        const stats = await fs.promises.stat(filepath);
        if (!stats.isFile()) return null;

        const ext = path.extname(filepath);
        const contentType = (mimeTypes as Record<string, string>)[ext] ?? 'application/octet-stream';

        if (stats.size <= MAX_CACHE_SIZE) {
            const buffer = await fs.promises.readFile(filepath);
            const data: CachedFile = { buffer, contentType, cachedAt: Date.now() };
            fileCache.set(filepath, data);
            if (logging) logCacheUsage('Added', filepath);
            return data;
        }

        return { path: filepath, contentType, cachedAt: Date.now() };
    } catch {
        return null;
    }
}

const server = http.createServer(async (req: IncomingMessage, res: ServerResponse) => {
    let start: bigint | undefined;
    let timerName = '';

    if (logging) {
        console.log(`Client: ${req.method} ${req.url}`);
        start = process.hrtime.bigint();
        timerName = `Server: ${req.method} ${req.url}`;
    }

    if (!port || Number.isNaN(port)) {
        console.error('Port must be specified and must be a number');
        printHelp(1);
    }

    if (
        devTools &&
        req.method === 'GET' &&
        req.url?.split('?')[0].endsWith('/.well-known/appspecific/com.chrome.devtools.json')
    ) {
        const uuid = crypto.randomUUID();
        const payload = zlib.gzipSync(
            JSON.stringify({
                workspace: {
                    root: process.cwd(),
                    uuid
                }
            })
        );

        res.writeHead(200, {
            'Content-Type': 'application/json',
            'Content-Encoding': 'gzip'
        });
        res.end(payload);

        if (!devToolsMsg) {
            console.log('Go to sources, workspace, and click "Connect"');
            devToolsMsg = true;
        } else if (logging) {
            console.log('DevTools Workspace initialized');
        }

        return;
    }

    const filepath = getFilePath(req.url);
    const fileData = await getFile(filepath);

    if (!fileData) {
        res.statusCode = 404;
        res.end('404, Not Found');
        if (logging) console.log(`Server: 404 ${req.url}`);
        return;
    } else {
        if (logging) console.log(`Server: Serving ${path.relative(process.cwd(), filepath)}`);
    }

    const ext = path.extname(filepath);
    const headers: Record<string, string> = {
        'Content-Type': fileData.contentType
    };

    if ('buffer' in fileData) {
        if (shouldCompress(ext)) {
            headers['Content-Encoding'] = 'gzip';
            res.writeHead(200, headers);

            const gzip = zlib.createGzip();
            const compressStart = logging ? process.hrtime.bigint() : undefined;
            gzip.on('finish', () => {
                if (logging && compressStart) {
                    const ms = Number(process.hrtime.bigint() - compressStart) / 1e6;
                    console.log(`Server: Compressed ${path.relative(process.cwd(), filepath)} in ${ms.toFixed(3)}ms`);
                }
            });
            gzip.pipe(res);
            gzip.end(fileData.buffer);
        } else {
            res.writeHead(200, headers);
            res.end(fileData.buffer);
        }
    } else {
        if (shouldCompress(ext)) {
            headers['Content-Encoding'] = 'gzip';
            res.writeHead(200, headers);

            const compressStart = logging ? process.hrtime.bigint() : undefined;
            const gzip = zlib.createGzip();
            gzip.on('finish', () => {
                if (logging && compressStart) {
                    const ms = Number(process.hrtime.bigint() - compressStart) / 1e6;
                    console.log(`Server: Compressed ${path.relative(process.cwd(), fileData.path)} in ${ms.toFixed(3)}ms`);
                }
            });
            gzip.on('error', () => {
                res.statusCode = 500;
                res.end('Internal Server Error');
            });

            const fileStream = fs.createReadStream(fileData.path);
            fileStream.on('error', () => {
                res.statusCode = 500;
                res.end('Internal Server Error');
            });
            fileStream.pipe(gzip).pipe(res);
        } else {
            res.writeHead(200, headers);
            const fileStream = fs.createReadStream(fileData.path);
            fileStream.on('error', () => {
                res.statusCode = 500;
                res.end('Internal Server Error');
            });
            fileStream.pipe(res);
        }
    }

    res.on('finish', () => {
        if (!logging || !start) return;
        const ms = Number(process.hrtime.bigint() - start) / 1e6;
        console.log(`${timerName} ${ms.toFixed(3)}ms`);
    });
});

server.listen(port, () => {
    console.log(
        port !== 80
            ? `Server running at http://localhost:${port}/`
            : 'Server running at http://localhost'
    );
});

process.on('SIGINT', () => {
    if (forcedExit) { 
        console.log('Force exiting server...');
        process.exit(0);
    }
    console.log('Shutting down server...');
    forcedExit = true;
    server.close(() => {
        console.log('Server stopped');
        process.exit(0);
    });
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught exception in server:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled rejection in server:', reason);
    process.exit(1);
});

process.on('warning', (warning) => {
    console.warn('Server Warning:', warning);
});

process.on('error', (err) => {
    console.error('Server Error:', err);
    process.exit(1);
});