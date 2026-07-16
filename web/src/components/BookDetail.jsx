import React from 'react';

function BookDetail({ detail }) {
  return (
    <div className="book-detail-layout">
      <section
        className={`book-detail-summary book-detail-status-${detail.status.value}`}
        aria-labelledby="book-detail-summary-title"
      >
        <header className="book-detail-section-header">
          <div>
            <p className="panel-label">Resumo do livro</p>
            <h2 id="book-detail-summary-title">Progresso registrado</h2>
          </div>
          <div className="book-detail-badges">
            <span className={`book-badge book-status book-status-${detail.status.value}`}>
              {detail.status.label}
            </span>
            <span className="book-badge book-category">
              <span
                className="book-category-swatch"
                style={{ '--category-color': detail.category.color }}
                aria-hidden="true"
              />
              {detail.category.name}
            </span>
          </div>
        </header>

        <div className="book-detail-progress" aria-label={`Progresso de ${detail.title}`}>
          <div className="book-detail-progress-heading">
            <span>{detail.progress.pageSummary}</span>
            <strong>{detail.progress.label}</strong>
          </div>
          <div
            className="book-progress-track"
            role="progressbar"
            aria-label={`Progresso de leitura de ${detail.title}`}
            aria-valuemin={0}
            aria-valuemax={detail.progress.totalPages}
            aria-valuenow={detail.progress.currentPage}
            aria-valuetext={`${detail.progress.label}; ${detail.progress.pageSummary}`}
          >
            <span
              className="book-progress-value"
              style={{ '--progress-value': `${detail.progress.value}%` }}
            />
          </div>
        </div>

        <dl className="book-detail-metrics" aria-label={`Metricas de ${detail.title}`}>
          {detail.metrics.map((metric) => (
            <div key={metric.label}>
              <dt>{metric.label}</dt>
              <dd>{metric.value}</dd>
              <span>{metric.detail}</span>
            </div>
          ))}
        </dl>
      </section>

      <section className="book-detail-panel" aria-labelledby="book-detail-metadata-title">
        <header className="book-detail-section-header">
          <div>
            <p className="panel-label">Metadados</p>
            <h2 id="book-detail-metadata-title">Dados do JSON</h2>
          </div>
        </header>
        <dl className="book-detail-metadata">
          {detail.metadata.map((item) => (
            <div key={item.label}>
              <dt>{item.label}</dt>
              <dd>
                {item.type === 'code' ? <code>{item.value}</code> : null}
                {item.type === 'link' ? (
                  <a href={item.value} rel="noreferrer" target="_blank">
                    {item.value}
                  </a>
                ) : null}
                {item.type === 'text' ? item.value : null}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="book-detail-panel" aria-labelledby="book-detail-classification-title">
        <header className="book-detail-section-header">
          <div>
            <p className="panel-label">Classificacao</p>
            <h2 id="book-detail-classification-title">Generos e tags</h2>
          </div>
        </header>

        <BookChipGroup emptyText="Sem generos registrados" items={detail.genres} label="Generos" />
        <BookChipGroup emptyText="Sem tags registradas" items={detail.tags} label="Tags" />

        {detail.category.isMissing ? (
          <div className="book-detail-note">
            <strong>Categoria ausente</strong>
            <p>
              O livro aponta para <code>{detail.category.slug}</code>, mas nenhum JSON
              com esse slug foi carregado em <code>data/categories</code>.
            </p>
          </div>
        ) : null}

        {detail.category.description ? (
          <div className="book-detail-note">
            <strong>{detail.category.name}</strong>
            <p>{detail.category.description}</p>
          </div>
        ) : null}

        {detail.notes ? (
          <div className="book-detail-note">
            <strong>Notas do livro</strong>
            <p>{detail.notes}</p>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function BookChipGroup({ emptyText, items, label }) {
  return (
    <div className="book-chip-group">
      <h3>{label}</h3>
      {items.length > 0 ? (
        <ul className="book-chip-list" aria-label={label}>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p>{emptyText}</p>
      )}
    </div>
  );
}

export default BookDetail;
