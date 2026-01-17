import { loadMDString } from "/scripts/phasor-loader.min.mjs";

// This file is used for and only for downloads.html

const listContainer = document.querySelector<HTMLDivElement>("#downloads-list");
// @ts-ignore
const livePreview = typeof window.vscode !== 'undefined';
const jsonTTL = 90 * 1000;


if (!listContainer) {
    throw new Error("Downloads list container not found");
}

// index.json Structure
type ReleaseFile = {
    url: string
    hash: string
}
type ReleaseData = {
    title: string
    commit: string
    type: string
    gh_release: string
    gh_changes: string
    vscode_release: string
    vs_release: string
    features: string[]
    files: Record<string, ReleaseFile>
    src?: string
    zip?: string
}

// load json file
async function getJson<T = any>(jsonPath: string): Promise<T> {
    if (livePreview) {
        const res = await fetch(jsonPath);
        if (!res.ok) throw new Error(`Failed to load JSON from ${jsonPath}`);
        return res.json() as Promise<T>;
    }

    const cacheKey = `json:${jsonPath}`;
    const cached = sessionStorage.getItem(cacheKey);

    if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < jsonTTL) return data as T;
        sessionStorage.removeItem(cacheKey);
    }

    const res = await fetch(jsonPath);
    if (!res.ok) throw new Error(`Failed to load JSON from ${jsonPath}`);

    const data = (await res.json()) as T;
    sessionStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));

    return data;
}

// Main routine of sorts
async function loadVersion(version: string | null) {
    const indexPath = "/downloads/index.json";
    const metaPath = "/downloads/meta.json";

    if (!version || version === "back") {
        const download_list = await generateVersionListMarkdown(indexPath);
        loadMDString(download_list, "#downloads-list");
        document.title = "Download Phasor";
        history.pushState(null, "", location.pathname);
    } else {
        if (version === "latest") {
            const versions = await getJson<Record<string, ReleaseData>>(indexPath);
            const latestVersion = Object.keys(versions)
                .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))[0];
            
            if (!latestVersion) throw new Error("No latest version found");
            version = latestVersion;
        }

        const mdString = await generateReleaseMarkdown(version, indexPath, metaPath);
        loadMDString(mdString, "#downloads-list");
        document.title = `Download Phasor ${version}`;
        history.pushState(null, "", `${location.pathname}?version=${version}`);
    }
}

listContainer.addEventListener("click", (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const btn = target.closest<HTMLElement>("[data-version]");
    if (!btn) return;
    loadVersion(btn.dataset.version ?? null);
});

window.addEventListener("popstate", () => {
    const params = new URLSearchParams(location.search);
    loadVersion(params.get("version"));
});

const params = new URLSearchParams(location.search);
loadVersion(params.get("version"));

export async function generateVersionListMarkdown(jsonPath: string): Promise<string> {
    const releases = await getJson<Record<string, ReleaseData>>(jsonPath);

    const versionLines = Object.keys(releases)
        .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
        .map(v => `- <span data-version="${v}" class="download-btn">${v}</span>`)
        .join("\n");

    return versionLines;
}

async function generateReleaseMarkdown(
    version: string,
    jsonPath: string,
    metaPath: string
): Promise<string> {
    // Load release data and meta mapping
    const releases = await getJson<Record<string, ReleaseData>>(jsonPath);
    const meta = await getJson<Record<string, { label: string; type: string }>>(metaPath);

    const entry = releases[version];
    if (!entry) throw new Error(`Version ${version} not found`);

    // Features list
    const featureLines = entry.features.map(f => `- ${f}`).join("\n");

    // Assets list
    const assetLines = Object.entries(entry.files)
        .map(([key, file]) => {
            const path = file.url;
            const fileName = path.split("/").pop() ?? path;
            const metaInfo = meta[key];

            if (metaInfo) {
                return `- ${metaInfo.label} [\`${fileName}\`](${path}) <sub>(${metaInfo.type})</sub> ${file.hash ? ` <sub>sha256:</sub> \`${file.hash}\`` : ""}`;
            }

            // Fallback for unknown keys
            return `- ${key} [\`${fileName}\`](${path}) ${file.hash ? ` <sub>sha256:</sub> \`${file.hash}\`` : ""}`;
        })
        .join("\n");

    return `<span data-version="back" class="download-btn">&larr; Back to all</span>
# ${version}

## ${entry.title}

Commit: \`${entry.commit ? entry.commit : "<commit>"}\` ${entry.type ? " | " : ""} **\`${entry.type ? `${entry.type}` : "<type>"}\`** ${entry.gh_release ? ` | [GitHub](${entry.gh_release})` : ""} ${entry.vscode_release ? ` | [VSCode](${entry.vscode_release})` : ""} ${entry.vs_release ? ` | [Visual Studio](${entry.vs_release})` : ""}

---

### Changes

${featureLines}

${entry.gh_changes ? `[Compare Releases (GitHub)](${entry.gh_changes})` : ""}

---

**Assets:**

${assetLines}

**Source Code: (GitHub)**

${entry.src ? `- [\`${entry.src.split("/").pop() ?? "Archive.tar.gz"}\`](${entry.src}) <sub>(gzip archive)</sub>` : ""}
${entry.zip ? `- [\`${entry.zip.split("/").pop() ?? "Archive.zip"}\`](${entry.zip}) <sub>(zip archive)</sub>` : ""}
`;
}

