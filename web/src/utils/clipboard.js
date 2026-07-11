export async function copyTextToClipboard(text) {
  if (typeof text !== 'string') {
    throw new TypeError('copyTextToClipboard expects string text');
  }

  const clipboard = globalThis.navigator?.clipboard;

  if (clipboard?.writeText) {
    await clipboard.writeText(text);
    return;
  }

  fallbackCopyText(text);
}

function fallbackCopyText(text) {
  const documentRef = globalThis.document;

  if (!documentRef?.body) {
    throw new Error('Clipboard is not available');
  }

  const textarea = documentRef.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '0';

  documentRef.body.appendChild(textarea);
  textarea.select();

  try {
    const copied = documentRef.execCommand('copy');

    if (!copied) {
      throw new Error('Clipboard copy was rejected');
    }
  } finally {
    textarea.remove();
  }
}
