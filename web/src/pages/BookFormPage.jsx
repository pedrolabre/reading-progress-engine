import React, { useMemo, useState } from 'react';

import CopyButton from '../components/CopyButton.jsx';
import DownloadButton from '../components/DownloadButton.jsx';
import FileInfo from '../components/FileInfo.jsx';
import JsonPreview from '../components/JsonPreview.jsx';
import {
  BOOK_STATUS_OPTIONS,
  INITIAL_BOOK_FORM_VALUES,
  createBookFormOutput,
} from '../utils/bookForm.js';

function BookFormPage() {
  const [values, setValues] = useState(INITIAL_BOOK_FORM_VALUES);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const output = useMemo(() => createBookFormOutput(values), [values]);
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
    return touched[field] || submitted ? output.errors[field] : '';
  }

  function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
  }

  function handleReset() {
    setValues(INITIAL_BOOK_FORM_VALUES);
    setTouched({});
    setSubmitted(false);
  }

  function applyCompletedCurrentPage() {
    if (!values.totalPages.trim()) {
      return;
    }

    updateField('currentPage', values.totalPages.trim());
    touchField('currentPage');
  }

  function applyTodayEndDate() {
    updateField('endDate', getTodayInputValue());
    touchField('endDate');
  }

  return (
    <section className="page-layout" aria-labelledby="book-form-page-title">
      <div className="page-header">
        <div className="page-copy">
          <p className="eyebrow">Book</p>
          <h1 id="book-form-page-title">Novo livro</h1>
          <p className="page-description">
            Gere um arquivo JSON de livro com slug, preview e destino prontos
            para commit manual.
          </p>
        </div>
      </div>

      <section className="book-form-layout" aria-label="Formulario de livro">
        <form
          className="panel book-form-panel"
          noValidate
          aria-labelledby="book-form-title"
          onSubmit={handleSubmit}
        >
          <div className="form-section-heading">
            <p className="panel-label">Formulario</p>
            <h2 id="book-form-title">Metadados</h2>
          </div>

          <div className="slug-preview" aria-live="polite">
            <span>Slug gerado</span>
            <code className="path-chip">{output.slug || 'aguardando-titulo'}</code>
          </div>

          <div className="form-grid">
            <Field
              id="title"
              label="Titulo"
              error={getVisibleError('title')}
              required
            >
              <input
                autoComplete="off"
                onBlur={() => touchField('title')}
                onChange={(event) => updateField('title', event.target.value)}
                placeholder="A Wizard of Earthsea"
                type="text"
                value={values.title}
              />
            </Field>

            <Field
              id="author"
              label="Autor"
              error={getVisibleError('author')}
              required
            >
              <input
                autoComplete="off"
                onBlur={() => touchField('author')}
                onChange={(event) => updateField('author', event.target.value)}
                placeholder="Ursula K. Le Guin"
                type="text"
                value={values.author}
              />
            </Field>

            <Field
              id="totalPages"
              label="Total de paginas"
              error={getVisibleError('totalPages')}
              required
            >
              <input
                inputMode="numeric"
                min="1"
                onBlur={() => touchField('totalPages')}
                onChange={(event) => updateField('totalPages', event.target.value)}
                placeholder="205"
                type="number"
                value={values.totalPages}
              />
            </Field>

            <Field
              id="currentPage"
              label="Pagina atual"
              error={getVisibleError('currentPage')}
              required
            >
              <input
                inputMode="numeric"
                min="0"
                onBlur={() => touchField('currentPage')}
                onChange={(event) => updateField('currentPage', event.target.value)}
                placeholder="0"
                type="number"
                value={values.currentPage}
              />
            </Field>

            <Field
              id="status"
              label="Status"
              error={getVisibleError('status')}
              required
            >
              <select
                onBlur={() => touchField('status')}
                onChange={(event) => updateField('status', event.target.value)}
                value={values.status}
              >
                {BOOK_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              id="category"
              label="Categoria"
              error={getVisibleError('category')}
              hint="Slug principal, ex: fantasy"
              required
            >
              <input
                autoComplete="off"
                onBlur={() => touchField('category')}
                onChange={(event) => updateField('category', event.target.value)}
                placeholder="fantasy"
                type="text"
                value={values.category}
              />
            </Field>

            <Field
              id="genres"
              label="Generos"
              error={getVisibleError('genres')}
              hint="Lista separada por virgulas"
            >
              <input
                autoComplete="off"
                onBlur={() => touchField('genres')}
                onChange={(event) => updateField('genres', event.target.value)}
                placeholder="fantasy, classic"
                type="text"
                value={values.genres}
              />
            </Field>

            <Field
              id="language"
              label="Idioma"
              error={getVisibleError('language')}
              hint="Duas letras minusculas"
            >
              <input
                autoComplete="off"
                maxLength="2"
                onBlur={() => touchField('language')}
                onChange={(event) => updateField('language', event.target.value)}
                placeholder="en"
                type="text"
                value={values.language}
              />
            </Field>

            <Field
              id="startDate"
              label="Data inicial"
              error={getVisibleError('startDate')}
            >
              <input
                onBlur={() => touchField('startDate')}
                onChange={(event) => updateField('startDate', event.target.value)}
                type="date"
                value={values.startDate}
              />
            </Field>

            <Field
              id="endDate"
              label="Data final"
              error={getVisibleError('endDate')}
            >
              <input
                onBlur={() => touchField('endDate')}
                onChange={(event) => updateField('endDate', event.target.value)}
                type="date"
                value={values.endDate}
              />
            </Field>

            <Field id="isbn" label="ISBN" error={getVisibleError('isbn')}>
              <input
                autoComplete="off"
                onBlur={() => touchField('isbn')}
                onChange={(event) => updateField('isbn', event.target.value)}
                placeholder="978-0-7653-2635-5"
                type="text"
                value={values.isbn}
              />
            </Field>

            <Field id="publisher" label="Editora" error={getVisibleError('publisher')}>
              <input
                autoComplete="off"
                onBlur={() => touchField('publisher')}
                onChange={(event) => updateField('publisher', event.target.value)}
                placeholder="Tor Books"
                type="text"
                value={values.publisher}
              />
            </Field>

            <Field id="year" label="Ano" error={getVisibleError('year')}>
              <input
                inputMode="numeric"
                max="9999"
                min="1000"
                onBlur={() => touchField('year')}
                onChange={(event) => updateField('year', event.target.value)}
                placeholder="1968"
                type="number"
                value={values.year}
              />
            </Field>

            <Field id="tags" label="Tags" error={getVisibleError('tags')} hint="Lista separada por virgulas">
              <input
                autoComplete="off"
                onBlur={() => touchField('tags')}
                onChange={(event) => updateField('tags', event.target.value)}
                placeholder="earthsea, favorites"
                type="text"
                value={values.tags}
              />
            </Field>

            <Field id="coverUrl" label="Capa URL" error={getVisibleError('coverUrl')}>
              <input
                autoComplete="off"
                onBlur={() => touchField('coverUrl')}
                onChange={(event) => updateField('coverUrl', event.target.value)}
                placeholder="https://example.com/cover.jpg"
                type="url"
                value={values.coverUrl}
              />
            </Field>

            <Field id="notes" label="Notas" error={getVisibleError('notes')} wide>
              <textarea
                onBlur={() => touchField('notes')}
                onChange={(event) => updateField('notes', event.target.value)}
                placeholder="Observacoes livres sobre esta edicao."
                rows="4"
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
          className="panel panel-compact generation-preview book-preview-panel"
          aria-labelledby="book-output-title"
        >
          <h2 className="panel-label" id="book-output-title">
            Saida
          </h2>
          <dl className="file-summary">
            <div>
              <dt>Modelo</dt>
              <dd>{'{slug}.json'}</dd>
            </div>
            <div>
              <dt>Destino</dt>
              <dd>
                <code className="path-chip">data/books/{'{slug}'}.json</code>
              </dd>
            </div>
          </dl>

          <FileInfo {...output.fileInfo} />

          {output.suggestions.length > 0 ? (
            <SuggestionBox
              onApplyCurrentPage={applyCompletedCurrentPage}
              onApplyEndDate={applyTodayEndDate}
              suggestions={output.suggestions}
            />
          ) : null}

          {output.isValid ? (
            <>
              <div className="file-actions" aria-label={`Acoes para ${output.fileInfo.fileName}`}>
                <CopyButton text={output.json} />
                <DownloadButton content={output.json} fileName={output.fileInfo.fileName} />
              </div>
              <JsonPreview json={output.json} title="Book JSON" />
            </>
          ) : (
            <div className="form-summary" role={submitted ? 'alert' : 'status'}>
              <strong>JSON aguardando campos validos</strong>
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

function SuggestionBox({ onApplyCurrentPage, onApplyEndDate, suggestions }) {
  return (
    <div className="suggestion-box" role="status">
      <strong>Sugestoes para completed</strong>
      <ul>
        {suggestions.map((suggestion) => (
          <li key={suggestion.id}>
            <span>{suggestion.message}</span>
            {suggestion.field === 'currentPage' ? (
              <button className="button-link" onClick={onApplyCurrentPage} type="button">
                Usar totalPages
              </button>
            ) : null}
            {suggestion.field === 'endDate' ? (
              <button className="button-link" onClick={onApplyEndDate} type="button">
                Usar hoje
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function getTodayInputValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export default BookFormPage;
