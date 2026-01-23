(() => {
  const params = new URLSearchParams(window.location.search);
  const file = params.get('f');
  const raw = params.has('raw');

  const iframe = document.getElementById('pdf-frame') as HTMLIFrameElement | null;

  if (!iframe) return;
  if (!file) {
    iframe.src = '/404.html';
    return;
  }

  const match = file.match(/\.(\d+)$/);
  if (!match) {
    iframe.src = '/404.html';
    return;
  }

  const ext = match[1];
  const pdfUrl = `/man${ext}/${file}.pdf`;
  const manUrl = `/man${ext}/${file}`;

  // Replace .<number> with (<number>) for the title
  const titleFormatted = file.replace(/\.(\d+)$/, '($1)');
  document.title = `${titleFormatted} | Phasor`;

  fetch(raw ? manUrl : pdfUrl, { method: 'HEAD' })
    .then(response => {
      iframe.src = response.ok ? (raw ? manUrl : pdfUrl) : '/404.html';
    })
    .catch(() => {
      iframe.src = '/404.html';
    });
})();