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
    <section className="page-layout" aria-labelledby="book-detail-page-title">
      <div className="page-header">
        <div className="page-copy">
          <p className="eyebrow">Livro</p>
          <h1 id="book-detail-page-title">{detail.title}</h1>
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
    <section className="page-layout" aria-labelledby="book-detail-loading-title">
      <div className="page-header">
        <div className="page-copy">
          <p className="eyebrow">Livro</p>
          <h1 id="book-detail-loading-title">Carregando detalhe</h1>
          <p className="page-description">
            Preparando os dados versionados para localizar <code>{slug}</code>.
          </p>
        </div>
      </div>
      <section
        className="library-surface library-state"
        aria-labelledby="book-detail-loading-state-title"
        aria-live="polite"
        aria-busy="true"
      >
        <div>
          <p className="panel-label">Biblioteca local</p>
          <h2 id="book-detail-loading-state-title">Carregando livro</h2>
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
  const errorMessage = formatLibraryErrorMessage(error);

  return (
    <section className="page-layout" aria-labelledby="book-detail-error-title">
      <div className="page-header">
        <div className="page-copy">
          <p className="eyebrow">Livro</p>
          <h1 id="book-detail-error-title">Detalhe indisponivel</h1>
          <p className="page-description">{errorMessage}</p>
        </div>
        <div className="page-actions">
          <Link className="button-link button-link-primary" to="/">
            Voltar para a biblioteca
          </Link>
        </div>
      </div>
      <section
        className="library-surface library-state library-state-error"
        role="alert"
        aria-labelledby="book-detail-error-state-title"
      >
        <div>
          <p className="panel-label">Erro recuperavel</p>
          <h2 id="book-detail-error-state-title">Revise os dados carregados</h2>
          <p>
            O detalhe usa os mesmos JSONs da biblioteca. Corrija o arquivo
            indicado, regenere o indice se necessario e recarregue a pagina.
          </p>
        </div>
        {details.length > 0 ? <BookDetailWarningList warnings={details} /> : null}
      </section>
    </section>
  );
}

function BookNotFoundPage({ detail, warnings }) {
  return (
    <section className="page-layout" aria-labelledby="book-not-found-title">
      <div className="page-header">
        <div className="page-copy">
          <p className="eyebrow">Livro</p>
          <h1 id="book-not-found-title">Livro nao encontrado</h1>
          <p className="page-description">
            Nao existe livro carregado com o slug <code>{detail.slug}</code>. Confira
            a rota ou salve o JSON esperado em <code>data/books</code>.
          </p>
        </div>
        <div className="page-actions">
          <Link className="button-link button-link-primary" to="/">
            Voltar para a biblioteca
          </Link>
        </div>
      </div>

      <section
        className="book-detail-not-found"
        role="status"
        aria-labelledby="book-not-found-state-title"
      >
        <span className="library-empty-mark" aria-hidden="true">
          ?
        </span>
        <div>
          <h2 id="book-not-found-state-title">Slug fora do acervo carregado</h2>
          <p>
            A biblioteca carregou normalmente. Abra um livro listado abaixo ou
            adicione um JSON de livro antes de tentar esta rota.
          </p>
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
      <p className="runtime-warning-note">
        O detalhe esta disponivel, mas alguns dados carregados pedem revisao antes
        do proximo commit de dados.
      </p>
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

function formatLibraryErrorMessage(error) {
  const message = error?.message || '';

  if (!message || message === 'Library data could not be loaded.') {
    return 'A biblioteca encontrou um JSON invalido, um caminho inesperado ou um dado obrigatorio ausente.';
  }

  return message;
}

export default BookDetailPage;
