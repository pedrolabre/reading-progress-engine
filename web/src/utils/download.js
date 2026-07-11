export function downloadTextFile({ content, fileName, type = 'application/json;charset=utf-8' }) {
  if (typeof content !== 'string') {
    throw new TypeError('downloadTextFile expects string content');
  }

  if (typeof fileName !== 'string' || fileName.trim() === '') {
    throw new Error('downloadTextFile expects a fileName');
  }

  const documentRef = globalThis.document;
  const urlRef = globalThis.URL;

  if (!documentRef || !urlRef) {
    throw new Error('downloadTextFile can only run in a browser');
  }

  const blob = new Blob([content], { type });
  const url = urlRef.createObjectURL(blob);
  const link = documentRef.createElement('a');

  try {
    link.href = url;
    link.download = fileName;
    link.rel = 'noopener';
    link.style.display = 'none';
    documentRef.body.appendChild(link);
    link.click();
  } finally {
    link.remove();
    urlRef.revokeObjectURL(url);
  }
}
