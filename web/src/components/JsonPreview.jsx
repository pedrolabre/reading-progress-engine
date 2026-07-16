import React from 'react';

function JsonPreview({ json, title = 'JSON preview' }) {
  const lineCount = json ? json.trimEnd().split('\n').length : 0;
  const titleId = React.useId();

  return (
    <div className="json-preview-block">
      <div className="json-preview-header">
        <span id={titleId}>{title}</span>
        <span>{lineCount} linhas</span>
      </div>
      <pre className="json-preview" tabIndex="0" aria-labelledby={titleId}>
        <code>{json}</code>
      </pre>
    </div>
  );
}

export default JsonPreview;
