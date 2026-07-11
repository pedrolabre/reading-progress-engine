import React from 'react';

import { downloadTextFile } from '../utils/download.js';

function DownloadButton({
  content,
  fileName,
  label = 'Baixar JSON',
  className = 'button-link button-link-primary',
}) {
  function handleClick() {
    downloadTextFile({ content, fileName });
  }

  return (
    <button
      type="button"
      className={className}
      disabled={!content || !fileName}
      onClick={handleClick}
    >
      {label}
    </button>
  );
}

export default DownloadButton;
