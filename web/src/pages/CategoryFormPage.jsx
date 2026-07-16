import React, { useMemo, useState } from 'react';

import CopyButton from '../components/CopyButton.jsx';
import DownloadButton from '../components/DownloadButton.jsx';
import FileInfo from '../components/FileInfo.jsx';
import JsonPreview from '../components/JsonPreview.jsx';
import {
  INITIAL_CATEGORY_FORM_VALUES,
  createCategoryFormOutput,
  createCategorySlug,
} from '../utils/categoryForm.js';

const COLOR_PATTERN = /^#[0-9A-F]{6}$/;
const DEFAULT_PICKER_COLOR = INITIAL_CATEGORY_FORM_VALUES.color;

function CategoryFormPage() {
  const [values, setValues] = useState(INITIAL_CATEGORY_FORM_VALUES);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [isSlugManual, setIsSlugManual] = useState(false);
  const output = useMemo(() => createCategoryFormOutput(values), [values]);
  const errorEntries = Object.entries(output.errors);

  function updateField(field, value) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateName(value) {
    setValues((current) => ({
      ...current,
      name: value,
      slug: isSlugManual ? current.slug : createCategorySlug(value),
    }));
  }

  function updateSlug(value) {
    setIsSlugManual(true);
    updateField('slug', value);
  }

  function updateColor(value) {
    updateField('color', value.toUpperCase());
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
    setValues(INITIAL_CATEGORY_FORM_VALUES);
    setTouched({});
    setSubmitted(false);
    setIsSlugManual(false);
  }

  function handleUseNameSlug() {
    updateField('slug', createCategorySlug(values.name));
    touchField('slug');
    setIsSlugManual(false);
  }

  return (
    <section className="page-layout" aria-labelledby="category-form-page-title">
      <div className="page-header">
        <div className="page-copy">
          <p className="eyebrow">Category</p>
          <h1 id="category-form-page-title">Nova categoria</h1>
          <p className="page-description">
            Gere um arquivo JSON de categoria com slug, cor, preview e destino
            prontos para commit manual.
          </p>
        </div>
      </div>

      <section className="category-form-layout" aria-label="Formulario de categoria">
        <form
          className="panel category-form-panel"
          noValidate
          aria-labelledby="category-form-title"
          onSubmit={handleSubmit}
        >
          <div className="form-section-heading">
            <p className="panel-label">Formulario</p>
            <h2 id="category-form-title">Classificacao</h2>
          </div>

          <div className="slug-preview" aria-live="polite">
            <span>Slug atual</span>
            <code className="path-chip">{output.slug || 'aguardando-nome'}</code>
          </div>

          <div className="form-grid">
            <Field
              id="name"
              label="Nome"
              error={getVisibleError('name')}
              required
            >
              <input
                autoComplete="off"
                onBlur={() => touchField('name')}
                onChange={(event) => updateName(event.target.value)}
                placeholder="Speculative Fiction"
                type="text"
                value={values.name}
              />
            </Field>

            <Field
              id="slug"
              label="Slug"
              error={getVisibleError('slug')}
              hint="Gerado pelo nome; pode ajustar manualmente"
              required
            >
              <input
                autoComplete="off"
                onBlur={() => touchField('slug')}
                onChange={(event) => updateSlug(event.target.value)}
                placeholder="speculative-fiction"
                type="text"
                value={values.slug}
              />
            </Field>

            <ColorField
              error={getVisibleError('color')}
              onBlur={() => touchField('color')}
              onChange={updateColor}
              value={values.color}
            />

            <Field id="description" label="Descricao" error={getVisibleError('description')} wide>
              <textarea
                onBlur={() => touchField('description')}
                onChange={(event) => updateField('description', event.target.value)}
                placeholder="Fiction that bends reality through imagined worlds, futures or rules."
                rows="5"
                value={values.description}
              />
            </Field>
          </div>

          <div className="form-actions">
            <button className="button-link button-link-primary" type="submit">
              Validar JSON
            </button>
            <button
              className="button-link"
              disabled={!values.name.trim()}
              onClick={handleUseNameSlug}
              type="button"
            >
              Usar slug do nome
            </button>
            <button className="button-link" onClick={handleReset} type="button">
              Limpar
            </button>
          </div>
        </form>

        <aside
          className="panel panel-compact generation-preview category-preview-panel"
          aria-labelledby="category-output-title"
        >
          <h2 className="panel-label" id="category-output-title">
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
                <code className="path-chip">data/categories/{'{slug}'}.json</code>
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
              <JsonPreview json={output.json} title="Category JSON" />
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

function ColorField({ error, onBlur, onChange, value }) {
  const errorId = error ? 'color-error' : undefined;
  const hintId = 'color-hint';
  const pickerValue = COLOR_PATTERN.test(value) ? value : DEFAULT_PICKER_COLOR;

  return (
    <div className="form-field">
      <label htmlFor="color">
        Cor
      </label>
      <div className="color-control-row">
        <input
          aria-describedby={[errorId, hintId].filter(Boolean).join(' ')}
          aria-invalid={error ? 'true' : undefined}
          autoComplete="off"
          id="color"
          maxLength="7"
          onBlur={onBlur}
          onChange={(event) => onChange(event.target.value)}
          placeholder="#70B7FF"
          type="text"
          value={value}
        />
        <input
          aria-label="Escolher cor da categoria"
          className="color-picker"
          onChange={(event) => onChange(event.target.value)}
          type="color"
          value={pickerValue}
        />
      </div>
      <span className="field-hint" id={hintId}>
        Opcional, em #RRGGBB
      </span>
      {error ? (
        <span className="field-error" id={errorId}>
          {error}
        </span>
      ) : null}
    </div>
  );
}

export default CategoryFormPage;
