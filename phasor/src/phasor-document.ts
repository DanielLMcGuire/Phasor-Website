import { loadMDfromQuery, loadMDfromQuery_s } from "/scripts/phasor-loader.min.mjs";

// This file is used for and only for document.html

const docTitle = document.getElementById("docTitle");
const params = new URLSearchParams(window.location.search);
const nameParam = params.get("name");
const fileParam = params.get("file");

if (nameParam) {
    document.title = `${nameParam} | Phasor`;
    if (docTitle) docTitle.innerHTML = nameParam;
} else if (fileParam) {
    document.title = `${fileParam} | Phasor`;
    if (docTitle) docTitle.innerHTML = fileParam;
} else {
    document.title = "Document | Phasor";
    if (docTitle) docTitle.innerHTML = "?file=&lt;path-to-relative-file&gt;(&name=&lt;page-name&gt;)";
}

loadMDfromQuery("#main_md", "file");
