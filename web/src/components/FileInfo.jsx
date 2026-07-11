import React from 'react';

function FileInfo({ fileName, path, slug }) {
  return (
    <dl className="file-summary file-summary-dense">
      <div>
        <dt>Nome</dt>
        <dd>{fileName}</dd>
      </div>
      <div>
        <dt>Caminho</dt>
        <dd>
          <code className="path-chip">{path}</code>
        </dd>
      </div>
      {slug ? (
        <div>
          <dt>Slug</dt>
          <dd>
            <code className="path-chip">{slug}</code>
          </dd>
        </div>
      ) : null}
    </dl>
  );
}

export default FileInfo;
