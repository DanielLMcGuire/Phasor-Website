(() => {
  const params = new URLSearchParams(window.location.search);
  const file = params.has('file') ? params.has('f') ? null : params.get('file') : params.get('f');
  const raw = params.has('raw');

  const errorPage = `<title>404 Not Found | Phasor</title><style>body{font-family:arial,sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0}.container{text-align:center;color:#444;max-width:400px;padding:20px;border:1px solid #eee;border-radius:5px;box-shadow:0 0 10px rgba(2,2,2,.35)}</style><div class=container><h1>404 Not Found</h1><p>The requested manual page could not be found.</div>`;

  const pageSection = document.getElementById('man-page') as HTMLIFrameElement | null;

  if (!pageSection) return;
  if (!errorPage) return;
  if (!file) {
    pageSection.srcdoc = errorPage;
    return;
  }

  const match = file.match(/\.(\d+)$/);
  if (!match) {
    pageSection.srcdoc = errorPage;
    return;
  }

  const ext = match[1];
  const pdfUrl = `/man${ext}/${file}.pdf`;
  const manualUrl = `/man${ext}/${file}`;
  const manualPage = raw ? manualUrl : pdfUrl;
  const manualTitle = file.replace(/\.(\d+)$/, '($1)');

  document.title = `${manualTitle} | Phasor`;

  fetch(raw ? manualUrl : pdfUrl, { method: 'HEAD' })
    .then(response => {
      pageSection.src = response.ok ? manualPage : pageSection.srcdoc = errorPage;
    })
    .catch(() => {
      pageSection.srcdoc = errorPage;
    });
})();