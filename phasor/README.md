# Phasor Website

Official website for the Phasor scripting language, built with TypeScript and a custom build system.

## Overview

Phasor uses a custom static website generator that compiles TypeScript modules into minified JavaScript, serving documentation, downloads, and language information for Phasor. The site uses a modular architecture with reusable components for content loading, theming, and page management.

## Project Structure

```
Website/
├── src/                    # TypeScript source files
│   ├── phasor-loader.ts    # Content loading utilities (Markdown/HTML)
│   ├── phasor-page.ts      # Page initialization and template loading
│   ├── phasor-downloads.ts # Download page generation
│   └── phasor-theme.ts     # Theme toggle (light/dark mode)
├── scripts/                # Compiled and minified JavaScript output, prism.js for highlighting
├── content/                # Static content
│   ├── docs/               # Documentation guides
│   ├── legal/              # License and policy documents
|   ├── site/               # Shared HTML Elements
│   └── std/                # Standard library specifications
├── themes/                 # CSS stylesheets
├── downloads/              # Release metadata and binaries
├── assets/                 # Favicons and branding
├── build.mjs               # Build script (TypeScript → JavaScript)
├── server.mjs              # Development server (NOT used in production)
└── package.json            # Dependencies and scripts
```

## TypeScript Modules

### phasor-loader.ts

Core content loading system with caching via sessionStorage.

**Key Functions:**

- `loadMD(url, selector)` - Fetch and render Markdown with syntax highlighting
- `loadMDString(mdString, selector)` - Render Markdown from string
- `preloadMD(urls)` - Pre-cache Markdown files
- `loadHTML(url, selector)` - Fetch and inject HTML templates
- `preloadHTML(urls)` - Pre-cache HTML templates
- `loadMDfromQuery(selector, param)` - Load Markdown from URL query parameters
- `showOverlay(content)` - Display modal overlay with content
- `getUrlParam(name)` / `hasUrlParam(name)` - URL parameter utilities

**Features:**

- Automatic image preloading from Markdown and HTML
- Prism.js syntax highlighting integration
- Marked.js for Markdown parsing
- Session-based caching to reduce network requests

### phasor-page.ts

Page initialization module that loads common templates.

**Functionality:**

- Preloads header and footer templates
- Injects templates into page on load
- Minimal setup for consistent page structure

### phasor-downloads.ts

Dynamic download page generator.

**Key Functions:**

- `generateVersionListMarkdown(jsonPath)` - Create version list from JSON
- `generateReleaseMarkdown(version, jsonPath)` - Generate release details page

**Features:**

- Parses `/downloads/index.json` for release metadata
- Generates platform-specific download links (Windows, macOS, Linux, Docker)
- Browser history integration with `popstate` events
- Supports "latest" version auto-detection
- Clickable version buttons for navigation

### phasor-theme.ts

Light/dark theme toggle system.

**Features:**

- Persists theme preference to localStorage
- Respects system color scheme preference
- Listens for system theme changes
- Updates button text dynamically
- Sets `data-theme` attribute on document root for CSS styling

## Development

### Prerequisites

- Node.js 24+
- npm

### Installation

```bash
npm install
```

### Development Server

```bash
npm start
```

Starts a local server on port 3000 with logging.

### Building

```bash
npm run build        # Development build
npm run build:prod   # Production build
```

## Production Deployment

The website is deployed as static files. Only the following directories are needed:

- `scripts/` - Compiled JavaScript (minified)
- `content/` - Markdown and HTML content
- `themes/` - CSS stylesheets
- `assets/` - Favicons and images
- `downloads/` - Release metadata
- `*.html` - HTML pages (index.html, docs.html, etc.)

**Do NOT deploy:**
- `src/` - TypeScript source (already compiled)
- `server.mjs` - Development server only
- `build.mjs` - Build script only
- `node_modules/` - Dependencies

## Content Management

### Adding Documentation
1. Create `.md` file in `content/docs/`
2. Link from homepage or navigation
3. Use `loadMD()` to render on page load

### Adding Downloads
1. Update `/downloads/index.json` with release metadata
2. Include platform-specific file paths
3. Download page auto-generates from JSON

### Modifying Templates
1. Edit HTML in `templates/`
2. Rebuild with `npm run build:prod`
3. Templates are cached in sessionStorage

## Styling

CSS is organized in `themes/`:
- `phasor.css` - Main stylesheet with theme variables
- `prism.css` - Syntax highlighting (Prism-JS)

Theme switching uses CSS custom properties (variables) controlled by `data-theme` attribute.

## Dependencies

**Runtime:**
- `marked` - Markdown parser (CDN)
- `prism.js` - Syntax highlighting

**Build-time:**
- `typescript` - TypeScript compiler
- `terser` - JavaScript minifier

## Performance Optimizations

- **Minification** - All JavaScript minified in production
- **Caching** - Content cached in sessionStorage to reduce requests
- **Preloading** - Critical content preloaded before display
- **Image Preloading** - Images extracted from content and preloaded
- **Source Maps** - Available in development for debugging

## Browser Support

- Modern browsers with ES2020 support
- Requires JavaScript enabled
- Graceful fallback for missing content

## License

See `content/legal/` for license information.
