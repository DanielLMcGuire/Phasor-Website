import { marked } from "./third-party/marked/lib/marked.esm.js";

const helpSite = "https://phasor.pages.dev/document.html?file=https%3A%2F%2Fphasor-docs.pages.dev%2Fcontent%2Fphasor-website-internals.md";

/**
 * Loads Prism.js and resolves when syntax highlighting is ready.
 * Safe to call multiple times.
 */
const prismReady = (() => {
    let promise: Promise<void> | null = null;
    return () => {
        if (promise) return promise;
        if ((window as any).Prism) return Promise.resolve();
        promise = new Promise((resolve, reject) => {
            const s = document.createElement("script");
            s.src = "/scripts/prism.js";
            s.onload = () => resolve();
            s.onerror = () => reject(new Error("Failed to load Prism.js"));
            document.head.appendChild(s);
        });
        return promise;
    };
})();

/**
 * In memory cache of preloaded images keyed by their resolved URL.
 */
const imageCache = new Map<string, HTMLImageElement>();

/**
 * Tracks images currently being loaded to prevent duplicate fetches.
 */
const imagePending = new Map<string, Promise<HTMLImageElement>>();

/**
 * Reads cached markdown text for a URL from sessionStorage.
 */
function getMD(url: string): string | null {
    return sessionStorage.getItem(`md:${url}`);
}

/**
 * Stores markdown text in sessionStorage for a URL.
 */
function setMD(url: string, text: string): void {
    sessionStorage.setItem(`md:${url}`, text);
}

/**
 * Removes cached markdown for a specific URL.
 */
export function unloadMD(url: string): void {
    sessionStorage.removeItem(`md:${url}`);
}

/**
 * Checks whether markdown for a URL exists in sessionStorage.
 */
export function mdExists(url: string): boolean {
    return sessionStorage.getItem(`md:${url}`) !== null;
}

/**
 * Fetches markdown from cache or network and stores it in sessionStorage.
 */
async function fetchMD(url: string): Promise<string> {
    const cached = getMD(url);
    if (cached) return cached;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
    const text = await res.text();
    setMD(url, text);
    return text;
}

/**
 * Loads markdown from a URL renders it into a target element
 * applies syntax highlighting and preloads referenced images.
 */
export async function loadMD(url: string, targetSelector: string): Promise<void> {
    try {
        const md = await fetchMD(url);
        await prismReady();

        marked.setOptions({
            highlight(code: string, lang: string) {
                const Prism = (window as any).Prism;
                return Prism?.languages[lang]
                    ? Prism.highlight(code, Prism.languages[lang], lang)
                    : code;
            }
        });

        let html = marked.parse(md);
        const images = extractImageURLsFromHTML(html);
        preloadImages(images);
        html = await replaceImagesInHTML(html);

        const target = document.querySelector<HTMLElement>(targetSelector);
        if (!target) throw new Error(`Target element not found: ${targetSelector}`);
        target.innerHTML = html;
    } catch (err) {
        console.error(err);
        console.log(`See ${helpSite}`);
    }
}

/**
 * Loads markdown based on a URL query parameter with a fallback path.
 */
export function loadMDfromQuery_s(
    targetSelector: string,
    param: string,
    defaultPath = '/content/404.md'
): void {
    const params = new URLSearchParams(window.location.search);
    let filePath = params.get(param) || defaultPath;

    if (!filePath.match(/^(\/|\.\/|\.\.\/|[^\/].*)/)) {
        filePath = defaultPath;
    }

    loadMD(filePath, targetSelector);
}

/**
 * Loads markdown based on a URL query parameter with a fallback path.
 */
export function loadMDfromQuery(
    targetSelector: string,
    param: string,
): void {
    console.warn(`Use loadMDfromQuery_s instead!\nSee ${helpSite}`);
    const params = new URLSearchParams(window.location.search);
    let filePath = params.get(param) || '/content/404.md';

    loadMD(filePath, targetSelector);
}

/**
 * Renders a raw markdown string directly into a target element.
 */
export async function loadMDString(mdString: string, targetSelector: string): Promise<void> {
    try {
        await prismReady();
        marked.setOptions({
            highlight(code: string, lang: string) {
                const Prism = (window as any).Prism;
                return Prism?.languages[lang]
                    ? Prism.highlight(code, Prism.languages[lang], lang)
                    : code;
            }
        });

        let html = marked.parse(mdString);
        const images = extractImageURLsFromHTML(html);
        preloadImages(images);
        html = await replaceImagesInHTML(html);

        const target = document.querySelector<HTMLElement>(targetSelector);
        if (!target) throw new Error(`Target element not found: ${targetSelector}`);
        target.innerHTML = html;
    } catch (err) {
        console.error(err);
        console.log(`See ${helpSite}`);
    }
}

/**
 * Preloads markdown files and their images efficiently.
 */
export async function preloadMD(urls: string[]): Promise<void> {
    await Promise.all(urls.map(async (url) => {
        try {
            // Fetch markdown (from cache or network)
            const md = await fetchMD(url);

            // Check if HTML version already cached to skip parsing
            const htmlCached = getHTML(url);
            const html = htmlCached ?? marked.parse(md);

            // Preload images
            const images = extractImageURLsFromHTML(html);
            preloadImages(images);

            // Cache HTML if not already cached
            if (!htmlCached) setHTML(url, html);

        } catch (err) {
            console.warn(`Failed to preload MD: ${url}`, err);
            console.log(`See ${helpSite}`);
        }
    }));
}

/**
 * Reads cached HTML for a URL from sessionStorage.
 */
function getHTML(url: string): string | null {
    return sessionStorage.getItem(`html:${url}`);
}

/**
 * Stores HTML text in sessionStorage for a URL.
 */
function setHTML(url: string, text: string): void {
    sessionStorage.setItem(`html:${url}`, text);
}

/**
 * Checks whether HTML for a URL exists in sessionStorage.
 */
export function htmlExists(url: string): boolean {
    return sessionStorage.getItem(`html:${url}`) !== null;
}

/**
 * Removes cached HTML for a specific URL.
 */
export function unloadHTML(url: string): void {
    sessionStorage.removeItem(`html:${url}`);
}

/**
 * Removes all cached HTML entries from sessionStorage.
 */
export function unloadAllHTML(): void {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
        if (key?.startsWith("html:")) {
            sessionStorage.removeItem(key);
        }
    }
}

/**
 * Fetches HTML from cache or network and stores it in sessionStorage.
 */
async function fetchHTML(url: string): Promise<string> {
    const cached = getHTML(url);
    if (cached) return cached;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
    const text = await res.text();
    setHTML(url, text);
    return text;
}

/**
 * Loads an HTML file into a target element and preloads its images.
 */
export async function loadHTML(url: string, targetSelector: string): Promise<void> {
    try {
        const wasCached = htmlExists(url);
        const html = await fetchHTML(url);
        if (!wasCached) {
            const images = extractImageURLsFromHTML(html);
            preloadImages(images);
        }

        const target = document.querySelector<HTMLElement>(targetSelector);
        if (!target) throw new Error(`Target element not found: ${targetSelector}`);
        target.innerHTML = html;

        await replaceImagesWithCache(target);
    } catch (err) {
        console.error(err);
        console.log(`See ${helpSite}`);
    }
}

/**
 * Preloads HTML files and their images efficiently.
 */
export async function preloadHTML(urls: string[]): Promise<void> {
    await Promise.all(urls.map(async (url) => {
        try {
            // Fetch HTML (from cache or network)
            const html = await fetchHTML(url);

            // Preload images
            const images = extractImageURLsFromHTML(html);
            preloadImages(images);
        } catch (err) {
            console.warn(`Failed to preload HTML: ${url}`, err);
            console.log(`See ${helpSite}`);
        }
    }));
}

/**
 * Extracts image URLs from HTML img elements.
 */
function extractImageURLsFromHTML(html: string): string[] {
    const urls: string[] = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    doc.querySelectorAll('img').forEach(img => {
        const src = img.getAttribute('src');
        if (!src || src.startsWith('data:')) return;
        try {
            urls.push(new URL(src, location.href).href);
        } catch {
            console.error(`Failed loading image: ${src}`);
            console.log(`See ${helpSite}`);
        }
    });
    return urls;
}

/**
 * Reads cached image data URL from localStorage.
 */
function getStoredImage(url: string): string | null {
    try {
        return localStorage.getItem(`img:${url}`);
    } catch {
        return null;
    }
}

/**
 * Stores image data URL in localStorage.
 */
function setStoredImage(url: string, dataUrl: string): void {
    try {
        localStorage.setItem(`img:${url}`, dataUrl);
    } catch {
        console.error("Issue storing image data!");
        console.log(`See ${helpSite}`);
    }
}


/**
 * Preloads images and stores them in cache.
 */
function preloadImages(urls: string[]): void {
    for (const url of urls) {
        if (imageCache.has(url) || imagePending.has(url)) continue;

        try {
            new URL(url);

            const stored = getStoredImage(url);
            if (stored) {
                const img = new Image();
                img.src = stored;
                imageCache.set(url, img);
                continue;
            }

            const promise = fetch(url)
                .then(r => r.blob())
                .then(blob => new Promise<HTMLImageElement>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        const dataUrl = reader.result as string;
                        const img = new Image();
                        img.src = dataUrl;
                        imageCache.set(url, img);
                        setStoredImage(url, dataUrl);
                        imagePending.delete(url);
                        resolve(img);
                    };
                    reader.readAsDataURL(blob);
                }))
                .catch(() => {
                    imagePending.delete(url);
                    return new Image();
                });
            imagePending.set(url, promise);
        } catch {
            console.error(`Failed preloading image from URL: ${url}`);
            console.log(`See ${helpSite}`);
        }
    }
}

/**
 * Returns a cached image element if available, waits if loading.
 */
export async function getCachedImage(url: string): Promise<HTMLImageElement | undefined> {
    const mem = imageCache.get(url);
    if (mem) return mem;

    const pending = imagePending.get(url);
    if (pending) return await pending;

    const stored = getStoredImage(url);
    if (!stored) return;

    const img = new Image();
    img.src = stored;
    imageCache.set(url, img);
    return img;
}

/**
 * Replaces img src attributes in HTML string with cached data URLs.
 */
async function replaceImagesInHTML(html: string): Promise<string> {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    await Promise.all(Array.from(doc.querySelectorAll('img')).map(async img => {
        const src = img.getAttribute('src');
        if (!src || src.startsWith('data:')) return;
        const cached = await getCachedImage(src);
        if (cached?.src) img.setAttribute('src', cached.src);
    }));
    return doc.body.innerHTML;
}

/**
 * Replaces img elements inside a target with cached clones when available.
 */
async function replaceImagesWithCache(target: HTMLElement): Promise<void> {
    await Promise.all(Array.from(target.querySelectorAll('img')).map(async img => {
        const src = img.getAttribute('src');
        if (!src || src.startsWith('data:')) return;

        const cached = await getCachedImage(src);
        if (cached) {
            const clone = cached.cloneNode(true) as HTMLImageElement;
            img.replaceWith(clone);
        }
    }));
}