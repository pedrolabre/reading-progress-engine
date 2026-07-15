import React, { useEffect, useState } from 'react';
import { Link, NavLink, Route, Routes, useParams } from 'react-router';

import LibraryGrid from './components/LibraryGrid.jsx';
import BookFormPage from './pages/BookFormPage.jsx';
import CategoryFormPage from './pages/CategoryFormPage.jsx';
import StrikeFormPage from './pages/StrikeFormPage.jsx';
import {
  LIBRARY_LOAD_STATUS,
  createLibraryLoadingState,
  loadLibraryData,
} from './utils/libraryLoader.js';
import { createLibraryMetrics } from './utils/libraryMetrics.js';

const navItems = [
  { to: '/', label: 'Biblioteca', end: true },
  { to: '/new/book', label: 'Novo livro' },
  { to: '/new/strike', label: 'Novo strike' },
  { to: '/new/category', label: 'Nova categoria' },
];

function App() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <Link className="brand" to="/" aria-label="Reading Progress Engine - Biblioteca">
          <span className="brand-name">Reading Progress Engine</span>
          <span className="brand-tagline">Structured reading data</span>
        </Link>

        <nav className="primary-nav" aria-label="Navegacao principal">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              className={({ isActive }) =>
                isActive ? 'primary-nav-link is-active' : 'primary-nav-link'
              }
              end={item.end}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="main-content">
        <Routes>
          <Route index element={<LibraryPage />} />
          <Route path="book/:slug" element={<BookDetailPage />} />
          <Route path="new/book" element={<BookFormPage />} />
          <Route path="new/strike" element={<StrikeFormPage />} />
          <Route path="new/category" element={<CategoryFormPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  );
}

function LibraryPage() {
  const [libraryState, setLibraryState] = useState(() => createLibraryLoadingState());

  useEffect(() => {
    setLibraryState(loadLibraryData());
  }, []);

  return (
    <Page
      eyebrow="Biblioteca"
      title="Sua biblioteca"
      description="Acompanhe cada leitura a partir dos JSONs versionados no seu repositorio."
      actions={
        <>
          <Link className="button-link button-link-primary" to="/new/book">
            Novo livro
          </Link>
          <Link className="button-link" to="/new/strike">
            Novo strike
          </Link>
        </>
      }
    >
      <LibraryView libraryState={libraryState} />
    </Page>
  );
}

function LibraryView({ libraryState }) {
  if (libraryState.status === LIBRARY_LOAD_STATUS.LOADING) {
    return (
      <section className="library-surface library-state" aria-live="polite" aria-busy="true">
        <div>
          <p className="panel-label">Biblioteca local</p>
          <h2>Carregando livros</h2>
          <p>Preparando os dados versionados para montar a biblioteca.</p>
        </div>
        <div className="library-loading-grid" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </section>
    );
  }

  if (libraryState.status === LIBRARY_LOAD_STATUS.ERROR) {
    const details = libraryState.error?.details || [];

    return (
      <section className="library-surface library-state library-state-error" role="alert">
        <div>
          <p className="panel-label">Biblioteca local</p>
          <h2>Dados indisponiveis</h2>
          <p>{libraryState.error?.message || 'Nao foi possivel carregar a biblioteca.'}</p>
          <p>Revise os arquivos JSON indicados e recarregue a pagina.</p>
        </div>
        {details.length > 0 ? <WarningList warnings={details} /> : null}
      </section>
    );
  }

  const data = libraryState.data;
  const runtimeMetrics = createLibraryMetrics(data);
  const warnings = [...data.warnings, ...runtimeMetrics.warnings];

  return (
    <section className="library-surface" aria-labelledby="library-grid-title">
      <header className="library-section-header">
        <div>
          <p className="panel-label">Acervo local</p>
          <h2 id="library-grid-title">Livros registrados</h2>
          <p>Progresso e atividade calculados a partir dos seus strikes.</p>
        </div>
        <div className="library-context" aria-label="Contexto da biblioteca">
          <span>{formatBookCount(runtimeMetrics.summary.totalBooks)}</span>
          <span>Ordem inicial</span>
        </div>
      </header>

      <dl className="library-totals" aria-label="Resumo da biblioteca">
        <div>
          <dt>Strikes</dt>
          <dd>{runtimeMetrics.summary.totalStrikes}</dd>
        </div>
        <div>
          <dt>Paginas lidas</dt>
          <dd>{runtimeMetrics.summary.totalPagesRead}</dd>
        </div>
        <div>
          <dt>Categorias</dt>
          <dd>{runtimeMetrics.summary.totalCategories}</dd>
        </div>
      </dl>

      <LibraryGrid books={runtimeMetrics.books} />
      {warnings.length > 0 ? <RuntimeWarnings warnings={warnings} /> : null}
    </section>
  );
}

function RuntimeWarnings({ warnings }) {
  return (
    <details className="runtime-warnings">
      <summary>{formatWarningCount(warnings.length)}</summary>
      <WarningList warnings={warnings} />
    </details>
  );
}

function WarningList({ warnings }) {
  return (
    <ul className="loader-list">
      {warnings.map((warning) => (
        <li key={warning}>{warning}</li>
      ))}
    </ul>
  );
}

function BookDetailPage() {
  const { slug } = useParams();

  return (
    <Page
      eyebrow="Livro"
      title="Detalhe do livro"
      description="Rota reservada para metadados, metricas e timeline. O detalhe permanece como placeholder nesta etapa."
      actions={
        <Link className="button-link" to="/new/strike">
          Novo strike
        </Link>
      }
    >
      <section className="panel">
        <p className="panel-label">Slug selecionado</p>
        <code className="path-chip">{slug}</code>
      </section>
    </Page>
  );
}

function NotFoundPage() {
  return (
    <Page
      eyebrow="404"
      title="Pagina indisponivel"
      description="A rota solicitada nao existe nesta aplicacao."
      actions={
        <Link className="button-link button-link-primary" to="/">
          Voltar para a biblioteca
        </Link>
      }
    >
      <section className="panel">
        <p className="panel-label">Rotas disponiveis</p>
        <RouteList />
      </section>
    </Page>
  );
}

function Page({ eyebrow, title, description, actions, children }) {
  return (
    <section className="page-layout">
      <div className="page-header">
        <div className="page-copy">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          {description ? <p className="page-description">{description}</p> : null}
        </div>
        {actions ? <div className="page-actions">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}

function RouteList() {
  return (
    <ul className="route-list">
      {navItems.map((item) => (
        <li key={item.to}>
          <Link to={item.to}>{item.label}</Link>
        </li>
      ))}
    </ul>
  );
}

function formatBookCount(count) {
  return count === 1 ? '1 livro' : `${count} livros`;
}

function formatWarningCount(count) {
  return count === 1 ? '1 aviso de dados' : `${count} avisos de dados`;
}

export default App;
