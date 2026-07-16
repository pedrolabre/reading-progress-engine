import React, { useMemo, useState } from 'react';

import CopyButton from '../components/CopyButton.jsx';
import DownloadButton from '../components/DownloadButton.jsx';
import FileInfo from '../components/FileInfo.jsx';
import JsonPreview from '../components/JsonPreview.jsx';
import {
  createInitialStrikeFormValues,
  createStrikeFormOutput,
} from '../utils/strikeForm.js';

function StrikeFormPage() {
  const [values, setValues] = useState(() => createInitialStrikeFormValues());
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const output = useMemo(() => createStrikeFormOutput(values), [values]);
  const errorEntries = Object.entries(output.errors);

  function updateField(field, value) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function touchField(field) {
    setTouched((current) => ({
      ...current,
      [field]: true,
    }));
  }

  function getVisibleError(field) {
    if (field === 'pagesRead') {
      return touched.startPage || touched.endPage || submitted ? output.errors[field] : '';
    }

    return touched[field] || submitted ? output.errors[field] : '';
  }

  function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
  }

  function handleReset() {
    setValues(createInitialStrikeFormValues());
    setTouched({});
    setSubmitted(false);
  }

  return (
    <section className="page-layout" aria-labelledby="strike-form-page-title">
      <div className="page-header">
        <div className="page-copy">
          <p className="eyebrow">Strike</p>
          <h1 id="strike-form-page-title">Novo strike</h1>
          <p className="page-description">
            Gere uma sessao de leitura com paginas calculadas. Voce ainda salva o
            JSON no caminho indicado e faz o commit manualmente.
          </p>
        </div>
      </div>

      <section className="strike-form-layout" aria-label="Formulario de strike">
        <form
          className="panel strike-form-panel"
          noValidate
          aria-labelledby="strike-form-title"
          onSubmit={handleSubmit}
        >
          <div className="form-section-heading">
            <p className="panel-label">Formulario</p>
            <h2 id="strike-form-title">Sessao de leitura</h2>
          </div>

          <div className="slug-preview" aria-live="polite">
            <span>Destino</span>
            <code className="path-chip">{output.fileInfo.path}</code>
          </div>

          <div className="form-grid">
            <Field
              id="book"
              label="Livro"
              error={getVisibleError('book')}
              hint="Slug do livro, ex: dune"
              required
            >
              <input
                autoComplete="off"
                onBlur={() => touchField('book')}
                onChange={(event) => updateField('book', event.target.value)}
                placeholder="dune"
                type="text"
                value={values.book}
              />
            </Field>

            <Field
              id="date"
              label="Data"
              error={getVisibleError('date')}
              required
            >
              <input
                onBlur={() => touchField('date')}
                onChange={(event) => updateField('date', event.target.value)}
                type="date"
                value={values.date}
              />
            </Field>

            <Field
              id="startPage"
              label="Pagina inicial"
              error={getVisibleError('startPage')}
              required
            >
              <input
                inputMode="numeric"
                min="0"
                onBlur={() => touchField('startPage')}
                onChange={(event) => updateField('startPage', event.target.value)}
                placeholder="100"
                type="number"
                value={values.startPage}
              />
            </Field>

            <Field
              id="endPage"
              label="Pagina final"
              error={getVisibleError('endPage')}
              required
            >
              <input
                inputMode="numeric"
                min="1"
                onBlur={() => touchField('endPage')}
                onChange={(event) => updateField('endPage', event.target.value)}
                placeholder="120"
                type="number"
                value={values.endPage}
              />
            </Field>

            <Field
              id="pagesRead"
              label="Paginas lidas"
              error={getVisibleError('pagesRead')}
              hint="Calculado por endPage - startPage"
              required
            >
              <input
                inputMode="numeric"
                readOnly
                tabIndex="0"
                type="number"
                value={output.pagesRead ?? ''}
              />
            </Field>

            <Field
              id="duration"
              label="Duracao"
              error={getVisibleError('duration')}
              hint="Minutos"
            >
              <input
                inputMode="numeric"
                min="1"
                onBlur={() => touchField('duration')}
                onChange={(event) => updateField('duration', event.target.value)}
                placeholder="45"
                type="number"
                value={values.duration}
              />
            </Field>

            <Field id="chapter" label="Capitulo" error={getVisibleError('chapter')}>
              <input
                autoComplete="off"
                onBlur={() => touchField('chapter')}
                onChange={(event) => updateField('chapter', event.target.value)}
                placeholder="Chapter 12 - Unity"
                type="text"
                value={values.chapter}
              />
            </Field>

            <Field id="mood" label="Mood" error={getVisibleError('mood')}>
              <input
                autoComplete="off"
                onBlur={() => touchField('mood')}
                onChange={(event) => updateField('mood', event.target.value)}
                placeholder="focused"
                type="text"
                value={values.mood}
              />
            </Field>

            <Field
              id="sequence"
              label="Sequencia"
              error={getVisibleError('sequence')}
              hint="So altera o nome do arquivo"
            >
              <input
                inputMode="numeric"
                min="1"
                onBlur={() => touchField('sequence')}
                onChange={(event) => updateField('sequence', event.target.value)}
                placeholder="1"
                type="number"
                value={values.sequence}
              />
            </Field>

            <Field id="notes" label="Notas" error={getVisibleError('notes')} wide>
              <textarea
                onBlur={() => touchField('notes')}
                onChange={(event) => updateField('notes', event.target.value)}
                placeholder="Observacoes livres sobre a sessao."
                rows="5"
                value={values.notes}
              />
            </Field>
          </div>

          <div className="form-actions">
            <button className="button-link button-link-primary" type="submit">
              Validar JSON
            </button>
            <button className="button-link" onClick={handleReset} type="button">
              Limpar
            </button>
          </div>
        </form>

        <aside
          className="panel panel-compact generation-preview strike-preview-panel"
          aria-labelledby="strike-output-title"
        >
          <h2 className="panel-label" id="strike-output-title">
            Saida
          </h2>
          <dl className="file-summary">
            <div>
              <dt>Modelo</dt>
              <dd>{'{date}.json ou {date}-{sequence}.json'}</dd>
            </div>
            <div>
              <dt>Destino</dt>
              <dd>
                <code className="path-chip">data/strikes/{'{book-slug}'}/{'{date}'}.json</code>
              </dd>
            </div>
          </dl>

          <FileInfo {...output.fileInfo} />

          {output.isValid ? (
            <>
              <div className="file-actions" aria-label={`Acoes para ${output.fileInfo.fileName}`}>
                <CopyButton text={output.json} />
                <DownloadButton content={output.json} fileName={output.fileInfo.fileName} />
              </div>
              <JsonPreview json={output.json} title="Strike JSON" />
            </>
          ) : (
            <div className="form-summary" role={submitted ? 'alert' : 'status'}>
              <strong>JSON ainda invalido</strong>
              <p>Corrija os campos listados para liberar copia, download e preview.</p>
              <ul>
                {errorEntries.map(([field, message]) => (
                  <li key={field}>{message}</li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </section>
    </section>
  );
}

function Field({ children, error, hint, id, label, required = false, wide = false }) {
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;
  const control = React.cloneElement(children, {
    'aria-describedby': describedBy,
    'aria-invalid': error ? 'true' : undefined,
    id,
  });

  return (
    <div className={wide ? 'form-field form-field-wide' : 'form-field'}>
      <label htmlFor={id}>
        {label}
        {required ? (
          <>
            <span aria-hidden="true">*</span>
            <span className="visually-hidden">obrigatorio</span>
          </>
        ) : null}
      </label>
      {control}
      {hint ? (
        <span className="field-hint" id={hintId}>
          {hint}
        </span>
      ) : null}
      {error ? (
        <span className="field-error" id={errorId}>
          {error}
        </span>
      ) : null}
    </div>
  );
}

export default StrikeFormPage;
