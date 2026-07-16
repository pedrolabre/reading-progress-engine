import React, { useEffect, useRef, useState } from 'react';

import { copyTextToClipboard } from '../utils/clipboard.js';

function CopyButton({
  text,
  label = 'Copiar JSON',
  successLabel = 'Copiado',
  errorLabel = 'Nao copiou',
  className = 'button-link',
}) {
  const [state, setState] = useState('idle');
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  async function handleClick() {
    try {
      await copyTextToClipboard(text);
      resetLater('copied');
    } catch {
      resetLater('error');
    }
  }

  function resetLater(nextState) {
    setState(nextState);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setState('idle');
    }, 1800);
  }

  const buttonLabel = state === 'copied' ? successLabel : state === 'error' ? errorLabel : label;

  return (
    <button
      type="button"
      className={className}
      data-state={state}
      disabled={!text}
      onClick={handleClick}
    >
      <span aria-live="polite">{buttonLabel}</span>
    </button>
  );
}

export default CopyButton;
