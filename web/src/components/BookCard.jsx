import React from 'react';
import { Link } from 'react-router';

const STATUS_LABELS = {
  'to-read': 'Quero ler',
  reading: 'Em leitura',
  paused: 'Pausado',
  completed: 'Concluido',
  dropped: 'Abandonado',
};

const numberFormatter = new Intl.NumberFormat('pt-BR');
const percentageFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 2,
});
const activityDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

function BookCard({ book }) {
  const { category, data, metrics, slug } = book;
  const title = metrics.title || data.title || 'Livro sem titulo';
  const author = metrics.author || data.author || 'Autor nao informado';
  const status = metrics.status || 'to-read';
  const statusLabel = STATUS_LABELS[status] || status;
  const categoryName =
    category?.data?.name ||
    (metrics.category ? `Categoria nao carregada: ${metrics.category}` : 'Categoria nao informada');
  const categoryColor = category?.data?.color || 'var(--color-accent-strong)';
  const lastActivityDate = metrics.activityDates?.lastActivityDate || null;
  const progressText = `${percentageFormatter.format(metrics.progress)}%`;

  return (
    <article className={`book-card book-card-status-${status}`}>
      <header className="book-card-header">
        <span className={`book-badge book-status book-status-${status}`}>{statusLabel}</span>
        <span className="book-badge book-category">
          <span
            className="book-category-swatch"
            style={{ '--category-color': categoryColor }}
            aria-hidden="true"
          />
          {categoryName}
        </span>
      </header>

      <div className="book-card-copy">
        <h3>
          <Link
            className="book-title-link"
            to={`/book/${slug}`}
            aria-label={`Ver detalhes de ${title}`}
          >
            {title}
          </Link>
        </h3>
        <p>{author}</p>
      </div>

      <section className="book-progress" aria-label={`Progresso de ${title}`}>
        <div className="book-progress-heading">
          <span>Progresso</span>
          <strong>{progressText}</strong>
        </div>
        <div
          className="book-progress-track"
          role="progressbar"
          aria-label={`Progresso de leitura de ${title}`}
          aria-valuemin={0}
          aria-valuemax={metrics.totalPages}
          aria-valuenow={metrics.currentPage}
          aria-valuetext={`${progressText}; pagina ${metrics.currentPage} de ${metrics.totalPages}`}
        >
          <span
            className="book-progress-value"
            style={{ '--progress-value': `${metrics.progress}%` }}
          />
        </div>
        <p className="book-page-count">
          <strong>{numberFormatter.format(metrics.currentPage)}</strong>
          <span> de {numberFormatter.format(metrics.totalPages)} paginas</span>
        </p>
      </section>

      <dl className="book-metrics" aria-label={`Metricas de ${title}`}>
        <div>
          <dt>Strikes</dt>
          <dd>{numberFormatter.format(metrics.totalStrikes)}</dd>
        </div>
        <div>
          <dt>Paginas lidas</dt>
          <dd>{numberFormatter.format(metrics.totalPagesRead)}</dd>
        </div>
      </dl>

      <footer className="book-card-footer">
        <div>
          <span className="book-activity-label">Ultima atividade</span>
          <strong>{formatActivityDate(lastActivityDate)}</strong>
        </div>
        <span className="book-card-cta" aria-hidden="true">
          Ver detalhes <span>→</span>
        </span>
      </footer>
    </article>
  );
}

function formatActivityDate(date) {
  if (!date) {
    return 'Sem atividade registrada';
  }

  const parsedDate = new Date(`${date}T00:00:00Z`);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return activityDateFormatter.format(parsedDate);
}

export default BookCard;
