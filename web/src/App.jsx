import React, { useEffect, useState } from 'react';
import { Link, NavLink, Route, Routes, useParams } from 'react-router';

import BookFormPage from './pages/BookFormPage.jsx';
import CategoryFormPage from './pages/CategoryFormPage.jsx';
import StrikeFormPage from './pages/StrikeFormPage.jsx';
import {
  LIBRARY_LOAD_STATUS,
  createLibraryLoadingState,
  loadLibraryData,
} from './utils/libraryLoader.js';

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
      title="Dados da biblioteca"
      description="Primeira leitura dos JSONs versionados para preparar a biblioteca visual."
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
      <section className="content-grid" aria-label="Estado da biblioteca">
        <LibraryLoaderPanel libraryState={libraryState} />

        <aside className="panel panel-compact" aria-label="Acoes principais">
          <p className="panel-label">Geracao</p>
          <h2>Arquivos JSON</h2>
          <RouteList />
        </aside>
      </section>
    </Page>
  );
}

function LibraryLoaderPanel({ libraryState }) {
  if (libraryState.status === LIBRARY_LOAD_STATUS.LOADING) {
    return (
      <article className="panel panel-feature loader-panel" aria-live="polite">
        <p className="panel-label">Data loader</p>
        <h2>Carregando JSONs</h2>
        <p>Preparando a leitura local dos arquivos versionados.</p>
        <div className="metric-row" aria-label="Contagens aguardando dados">
          <MetricCard value="..." label="livros" />
          <MetricCard value="..." label="categorias" />
          <MetricCard value="..." label="strikes" />
        </div>
      </article>
    );
  }

  if (libraryState.status === LIBRARY_LOAD_STATUS.ERROR) {
    const details = libraryState.error?.details || [];

    return (
      <article className="panel panel-feature loader-panel loader-panel-error" role="alert">
        <p className="panel-label">Data loader</p>
        <h2>Dados indisponiveis</h2>
        <p>{libraryState.error?.message || 'Nao foi possivel carregar a biblioteca.'}</p>
        {details.length > 0 ? (
          <ul className="loader-list">
            {details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        ) : null}
      </article>
    );
  }

  const data = libraryState.data;
  const summary = data.summary;

  return (
    <article className="panel panel-feature loader-panel" aria-live="polite">
      <p className="panel-label">Data loader</p>
      <h2>JSONs carregados</h2>
      <p>
        Books, categories, strikes e library estao normalizados para os proximos
        blocos da visualizacao.
      </p>

      <div className="metric-row" aria-label="Dados carregados">
        <MetricCard value={summary.totalBooks} label="livros" />
        <MetricCard value={summary.totalCategories} label="categorias" />
        <MetricCard value={summary.totalStrikes} label="strikes" />
      </div>

      <dl className="loader-summary">
        <div>
          <dt>Estrategia</dt>
          <dd>{data.source.strategy}</dd>
        </div>
        <div>
          <dt>Library</dt>
          <dd>{summary.generatedAt}</dd>
        </div>
        <div>
          <dt>Avisos</dt>
          <dd>{summary.warningCount}</dd>
        </div>
      </dl>
    </article>
  );
}

function BookDetailPage() {
  const { slug } = useParams();

  return (
    <Page
      eyebrow="Livro"
      title="Detalhe do livro"
      description="Rota preparada para receber metadados, metricas e timeline quando a visualizacao da biblioteca for implementada."
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

function MetricCard({ value, label }) {
  return (
    <div className="metric-card">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

export default App;
