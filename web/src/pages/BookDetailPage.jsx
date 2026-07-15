import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';

import BookDetail from '../components/BookDetail.jsx';
import BookTimeline from '../components/BookTimeline.jsx';
import {
  LIBRARY_LOAD_STATUS,
  createLibraryLoadingState,
  loadLibraryData,
} from '../utils/libraryLoader.js';
import { createBookDetail } from '../utils/bookDetail.js';
import { createLibraryMetrics } from '../utils/libraryMetrics.js';

function BookDetailPage() {
  const { slug } = useParams();
  const [libraryState, setLibraryState] = useState(() => createLibraryLoadingState());

  useEffect(() => {
    setLibraryState(loadLibraryData());
  }, []);

  if (libraryState.status === LIBRARY_LOAD_STATUS.LOADING) {
    return <BookDetailLoadingPage slug={slug} />;
  }

  if (libraryState.status === LIBRARY_LOAD_STATUS.ERROR) {
    return <BookDetailErrorPage error={libraryState.error} />;
  }

  const libraryData = libraryState.data;
  const libraryMetrics = createLibraryMetrics(libraryData);
  const detail = createBookDetail(libraryMetrics, slug);
  const warnings = [...libraryData.warnings, ...libraryMetrics.warnings];

  if (!detail.found) {
    return <BookNotFoundPage detail={detail} warnings={warnings} />;
  }

  return (
    <section className="page-layout">
      <div className="page-header">
        <div className="page-copy">
          <p className="eyebrow">Livro</p>
          <h1>{detail.title}</h1>
          <p className="page-description">{detail.author}</p>
        </div>
        <div className="page-actions">
          <Link className="button-link" to="/">
            Biblioteca
          </Link>
          <Link className="button-link button-link-primary" to="/new/strike">
            Novo strike
          </Link>
        </div>
      </div>

      <BookDetail detail={detail} />
      <BookTimeline entries={detail.timeline} title={detail.title} />
      {warnings.length > 0 ? <BookDetailWarnings warnings={warnings} /> : null}
    </section>
  );
}

function BookDetailLoadingPage({ slug }) {
  return (
    <section className="page-layout">
      <div className="page-header">
        <div className="page-copy">
          <p className="eyebrow">Livro</p>
          <h1>Carregando detalhe</h1>
          <p className="page-description">
            Preparando os dados versionados para localizar <code>{slug}</code>.
          </p>
        </div>
      </div>
      <section className="library-surface library-state" aria-live="polite" aria-busy="true">
        <div>
          <p className="panel-label">Biblioteca local</p>
          <h2>Carregando livro</h2>
          <p>O detalhe usa os mesmos JSONs normalizados da biblioteca.</p>
        </div>
        <div className="library-loading-grid" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </section>
    </section>
  );
}

function BookDetailErrorPage({ error }) {
  const details = error?.details || [];

  return (
    <section className="page-layout">
      <div className="page-header">
        <div className="page-copy">
          <p className="eyebrow">Livro</p>
          <h1>Dados indisponiveis</h1>
          <p className="page-description">
            {error?.message || 'Nao foi possivel carregar a biblioteca.'}
          </p>
        </div>
        <div className="page-actions">
          <Link className="button-link button-link-primary" to="/">
            Voltar para a biblioteca
          </Link>
        </div>
      </div>
      <section className="library-surface library-state library-state-error" role="alert">
        <div>
          <p className="panel-label">Erro recuperavel</p>
          <h2>Revise os JSONs</h2>
          <p>Corrija os arquivos indicados e recarregue a pagina.</p>
        </div>
        {details.length > 0 ? <BookDetailWarningList warnings={details} /> : null}
      </section>
    </section>
  );
}

function BookNotFoundPage({ detail, warnings }) {
  return (
    <section className="page-layout">
      <div className="page-header">
        <div className="page-copy">
          <p className="eyebrow">Livro</p>
          <h1>Livro nao encontrado</h1>
          <p className="page-description">
            Nao existe livro carregado com o slug <code>{detail.slug}</code>.
          </p>
        </div>
        <div className="page-actions">
          <Link className="button-link button-link-primary" to="/">
            Voltar para a biblioteca
          </Link>
        </div>
      </div>

      <section className="book-detail-not-found" role="status">
        <span className="library-empty-mark" aria-hidden="true">
          ?
        </span>
        <div>
          <h2>Escolha um livro registrado</h2>
          <p>A biblioteca carregou normalmente, mas esse slug nao faz parte do acervo.</p>
        </div>
        {detail.availableBooks.length > 0 ? (
          <ul className="book-detail-available-list" aria-label="Livros disponiveis">
            {detail.availableBooks.map((book) => (
              <li key={book.slug}>
                <Link to={`/book/${book.slug}`}>{book.title}</Link>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      {warnings.length > 0 ? <BookDetailWarnings warnings={warnings} /> : null}
    </section>
  );
}

function BookDetailWarnings({ warnings }) {
  return (
    <details className="runtime-warnings">
      <summary>{formatWarningCount(warnings.length)}</summary>
      <BookDetailWarningList warnings={warnings} />
    </details>
  );
}

function BookDetailWarningList({ warnings }) {
  return (
    <ul className="loader-list">
      {warnings.map((warning) => (
        <li key={warning}>{warning}</li>
      ))}
    </ul>
  );
}

function formatWarningCount(count) {
  return count === 1 ? '1 aviso de dados' : `${count} avisos de dados`;
}

export default BookDetailPage;
