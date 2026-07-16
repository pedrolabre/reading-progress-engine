import React from 'react';
import { Link } from 'react-router';

function BookTimeline({ entries = [], title }) {
  return (
    <section className="book-timeline" aria-labelledby="book-timeline-title">
      <header className="book-detail-section-header">
        <div>
          <p className="panel-label">Timeline</p>
          <h2 id="book-timeline-title">Strikes em ordem cronologica</h2>
          <p>{formatTimelineCount(entries.length)}</p>
        </div>
        <Link className="button-link" to="/new/strike">
          Novo strike
        </Link>
      </header>

      {entries.length === 0 ? (
        <div className="book-timeline-empty" role="status">
          <span className="library-empty-mark" aria-hidden="true">
            0
          </span>
          <div>
            <h3>Nenhum strike registrado</h3>
            <p>Este livro ainda nao tem sessoes de leitura associadas.</p>
          </div>
          <Link className="button-link button-link-primary" to="/new/strike">
            Registrar strike
          </Link>
        </div>
      ) : (
        <ol className="book-timeline-list" aria-label={`Timeline de ${title}`}>
          {entries.map((entry) => (
            <li className="book-timeline-item" key={entry.id}>
              <article>
                <header className="book-timeline-item-header">
                  <div>
                    <time dateTime={entry.date}>{entry.dateLabel}</time>
                    <h3>{entry.chapter || 'Strike de leitura'}</h3>
                  </div>
                  <span>{entry.pagesReadLabel}</span>
                </header>

                <div className="book-timeline-progress">
                  <div
                    className="book-progress-track"
                    role="progressbar"
                    aria-label={`Progresso depois do strike de ${entry.dateLabel}`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={entry.progressValue}
                    aria-valuetext={entry.progressLabel}
                  >
                    <span
                      className="book-progress-value"
                      style={{ '--progress-value': `${entry.progressValue}%` }}
                    />
                  </div>
                  <p>{entry.progressLabel}</p>
                </div>

                <dl className="book-timeline-facts">
                  <div>
                    <dt>Paginas</dt>
                    <dd>{entry.pageRangeLabel}</dd>
                  </div>
                  {entry.durationLabel ? (
                    <div>
                      <dt>Duracao</dt>
                      <dd>{entry.durationLabel}</dd>
                    </div>
                  ) : null}
                  {entry.mood ? (
                    <div>
                      <dt>Mood</dt>
                      <dd>{entry.mood}</dd>
                    </div>
                  ) : null}
                </dl>

                {entry.notes ? <p className="book-timeline-notes">{entry.notes}</p> : null}
              </article>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function formatTimelineCount(count) {
  if (count === 0) {
    return 'Nenhum strike para este livro.';
  }

  return count === 1 ? '1 strike registrado.' : `${count} strikes registrados.`;
}

export default BookTimeline;
