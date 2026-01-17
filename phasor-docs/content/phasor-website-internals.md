## Table of Contents

1. [Prism.js Initialization](#prismjs-initialization)
2. [Markdown Caching and Loading](#markdown-caching-and-loading)
3. [HTML Caching and Loading](#html-caching-and-loading)
4. [Image Preloading and Caching](#image-preloading-and-caching)
5. [Utility Functions](#utility-functions)
6. [Usage Examples](#usage-examples)

---

## Prism.js Initialization

### `prismReady(): Promise<void>`

* Ensures `Prism.js` is loaded and ready for syntax highlighting.
* Safe to call multiple times.
* Returns a `Promise` that resolves once Prism is available.

```ts
await prismReady();
```

---

## Markdown Caching and Loading

### Cache Management

* **getMD(url: string): string | null** – Returns cached Markdown text for a URL from `sessionStorage`.
* **setMD(url: string, text: string): void** – Stores Markdown text in `sessionStorage`.
* **unloadMD(url: string): void** – Removes cached Markdown for a specific URL.
* **mdExists(url: string): boolean** – Checks if Markdown exists in cache.

### Fetching and Rendering

* **fetchMD(url: string): Promise<string>** – Fetches Markdown from cache or network, storing it in `sessionStorage`.

* **loadMD(url: string, targetSelector: string): Promise<void>**
  Loads Markdown into a target element, applies syntax highlighting, and preloads referenced images.

* **loadMDString(mdString: string, targetSelector: string): Promise<void>**
  Renders a raw Markdown string directly into a target element.

* **loadMDfromQuery_s(targetSelector: string, param: string, defaultPath?: string): void**
  Loads Markdown based on a URL query parameter with a fallback path.

* **loadMDfromQuery(targetSelector: string, param: string): void**
  Deprecated. Use `loadMDfromQuery_s`.

* **preloadMD(urls: string[]): Promise<void>**
  Preloads Markdown files and images efficiently.

---

## HTML Caching and Loading

### Cache Management

* **getHTML(url: string): string | null** – Returns cached HTML from `sessionStorage`.
* **setHTML(url: string, text: string): void** – Stores HTML in cache.
* **htmlExists(url: string): boolean** – Checks if HTML is cached.
* **unloadHTML(url: string): void** – Removes cached HTML for a specific URL.
* **unloadAllHTML(): void** – Clears all cached HTML entries.

### Fetching and Rendering

* **fetchHTML(url: string): Promise<string>** – Fetches HTML from cache or network.
* **loadHTML(url: string, targetSelector: string): Promise<void>** – Loads HTML into a target element and preloads images.
* **preloadHTML(urls: string[]): Promise<void>** – Preloads HTML files and their images.

---

## Image Preloading and Caching

### Memory and LocalStorage Caching

* **imageCache** – In-memory cache of preloaded images.

* **imagePending** – Tracks currently loading images to avoid duplicate fetches.

* **getStoredImage(url: string): string | null** – Reads cached image data URL from `localStorage`.

* **setStoredImage(url: string, dataUrl: string): void** – Stores image data URL in `localStorage`.

### Image Preloading

* **preloadImages(urls: string[]): void** – Preloads images, caches them in memory, and stores in `localStorage`.

* **getCachedImage(url: string): Promise<HTMLImageElement | undefined>**
  Returns a cached image or waits for its loading to complete.

### Image Replacement

* **replaceImagesInHTML(html: string): Promise<string>** – Replaces `<img>` sources in HTML with cached data URLs.

* **replaceImagesWithCache(target: HTMLElement): Promise<void>** – Replaces `<img>` elements in a DOM element with cached clones.

* **extractImageURLsFromHTML(html: string): string[]** – Helper function to extract all image URLs from HTML content.

---

## Utility Functions

* `marked.setOptions({ highlight: ... })` – Configures Markdown syntax highlighting via Prism.
* All caching uses a `prefix:` convention in storage:

  * `md:<url>` – Markdown content
  * `html:<url>` – HTML content
  * `img:<url>` – Image data URL

---

## Usage Examples

### Load Markdown from URL

```ts
await loadMD('/content/example.md', '#content');
```

### Load Markdown from Query Parameter

```ts
loadMDfromQuery_s('#content', 'file', '/content/default.md');
```

### Preload Multiple Markdown Files

```ts
await preloadMD(['/content/a.md', '/content/b.md']);
```

### Load HTML

```ts
await loadHTML('/partials/header.html', '#header');
```

### Preload HTML Files

```ts
await preloadHTML(['/partials/header.html', '/partials/footer.html']);
```

### Get Cached Image

```ts
const img = await getCachedImage('/images/logo.png');
document.body.appendChild(img);
```
