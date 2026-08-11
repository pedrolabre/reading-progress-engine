import React, { useEffect, useId, useState } from 'react';
import { Link, NavLink, Route, Routes, useSearchParams } from 'react-router';

import LibraryFilterControls from './components/LibraryFilterControls.jsx';
import LibraryGrid from './components/LibraryGrid.jsx';
import LibrarySortControls from './components/LibrarySortControls.jsx';
import BookDetailPage from './pages/BookDetailPage.jsx';
import BookFormPage from './pages/BookFormPage.jsx';
import CategoryFormPage from './pages/CategoryFormPage.jsx';
import StrikeFormPage from './pages/StrikeFormPage.jsx';
import {
  LIBRARY_LOAD_STATUS,
  createLibraryLoadingState,
  loadLibraryData,
} from './utils/libraryLoader.js';
import {
  countActiveLibraryFilters,
  createEmptyLibraryFilters,
  createLibraryFilterOptions,
  filterLibraryBooks,
  toggleLibraryFilterValue,
} from './utils/libraryFilters.js';
import { createLibraryMetrics } from './utils/libraryMetrics.js';
import {
  LIBRARY_SORT_OPTIONS,
  getLibrarySortOption,
  sortLibraryBooks,
} from './utils/librarySorting.js';
import {
  createLibrarySearchParams,
  parseLibraryUrlState,
  validateLibraryUrlFilters,
} from './utils/libraryUrlState.js';

const navItems = [
  { to: '/', label: 'Biblioteca', end: true },
  { to: '/new/book', label: 'Novo livro' },
  { to: '/new/strike', label: 'Novo strike' },
  { to: '/new/category', label: 'Nova categoria' },
];

function App() {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#conteudo-principal">
        Pular para o conteudo principal
      </a>

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

      <main className="main-content" id="conteudo-principal">
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [libraryState, setLibraryState] = useState(() => createLibraryLoadingState());
  const libraryUrlState = parseLibraryUrlState(searchParams);
  const currentLibrarySearch = searchParams.toString();
  const canonicalLibrarySearch = createLibrarySearchParams(libraryUrlState).toString();

  useEffect(() => {
    setLibraryState(loadLibraryData());
  }, []);

  useEffect(() => {
    if (canonicalLibrarySearch !== currentLibrarySearch) {
      setSearchParams(canonicalLibrarySearch, { replace: true });
    }
  }, [canonicalLibrarySearch, currentLibrarySearch, setSearchParams]);

  function handleLibraryUrlStateChange(nextUrlState) {
    setSearchParams(createLibrarySearchParams(nextUrlState), { replace: true });
  }

  return (
    <Page
      eyebrow="Biblioteca"
      title="Sua biblioteca"
      description="Acompanhe cada leitura a partir dos JSONs versionados no seu repositorio."
    >
      <div className="library-page-body">
        <LibraryView
          libraryState={libraryState}
          libraryUrlState={libraryUrlState}
          onLibraryUrlStateChange={handleLibraryUrlStateChange}
        />
      </div>
    </Page>
  );
}

function LibraryView({
  libraryState,
  libraryUrlState,
  onLibraryUrlStateChange,
}) {
  if (libraryState.status === LIBRARY_LOAD_STATUS.LOADING) {
    return (
      <section
        className="library-surface library-state"
        aria-labelledby="library-loading-title"
        aria-live="polite"
        aria-busy="true"
      >
        <div>
          <p className="panel-label">Biblioteca local</p>
          <h2 id="library-loading-title">Carregando livros</h2>
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
    const errorMessage = formatLibraryErrorMessage(libraryState.error);

    return (
      <section
        className="library-surface library-state library-state-error"
        role="alert"
        aria-labelledby="library-error-title"
      >
        <div>
          <p className="panel-label">Biblioteca local</p>
          <h2 id="library-error-title">Biblioteca nao carregou</h2>
          <p>{errorMessage}</p>
          <p>
            Corrija os JSONs em <code>data/books</code>, <code>data/categories</code>,
            <code>data/strikes</code> ou <code>data/library.json</code> e recarregue a
            pagina.
          </p>
        </div>
        {details.length > 0 ? <WarningList warnings={details} /> : null}
      </section>
    );
  }

  const data = libraryState.data;
  const runtimeMetrics = createLibraryMetrics(data);
  const warnings = [...data.warnings, ...runtimeMetrics.warnings];
  const activeSortOption = getLibrarySortOption(libraryUrlState.sortId);
  const filterOptions = createLibraryFilterOptions(runtimeMetrics.books);
  const activeFilters = validateLibraryUrlFilters(libraryUrlState.filters, filterOptions);
  const activeFilterCount = countActiveLibraryFilters(activeFilters);
  const filteredBooks = filterLibraryBooks(runtimeMetrics.books, activeFilters);
  const sortedBooks = sortLibraryBooks(filteredBooks, activeSortOption.id);

  function handleLibrarySortChange(sortId) {
    onLibraryUrlStateChange({
      sortId: getLibrarySortOption(sortId).id,
      filters: activeFilters,
    });
  }

  function handleLibraryFilterToggle(groupId, value) {
    onLibraryUrlStateChange({
      sortId: activeSortOption.id,
      filters: toggleLibraryFilterValue(activeFilters, groupId, value),
    });
  }

  function handleLibraryFiltersClear() {
    onLibraryUrlStateChange({
      sortId: activeSortOption.id,
      filters: createEmptyLibraryFilters(),
    });
  }

  return (
    <>
      <section className="library-surface" aria-labelledby="library-grid-title">
        <h2 className="visually-hidden" id="library-grid-title">
          Livros registrados
        </h2>

        <div className="library-overview-row">
          <div className="library-context" aria-label="Contexto da biblioteca">
            <span>{formatBookCount(runtimeMetrics.summary.totalBooks)}</span>
          </div>

          <LibrarySortControls
            activeOption={activeSortOption}
            options={LIBRARY_SORT_OPTIONS}
            sortId={activeSortOption.id}
            onSortChange={handleLibrarySortChange}
          />

          <dl className="library-totals" aria-label="Resumo da biblioteca">
            <div>
              <dt>Sessoes documentadas</dt>
              <dd>{runtimeMetrics.summary.totalStrikes}</dd>
            </div>
            <div>
              <dt>Paginas documentadas</dt>
              <dd>{runtimeMetrics.summary.totalPagesRead}</dd>
            </div>
            <div>
              <dt>Categorias</dt>
              <dd>{runtimeMetrics.summary.totalCategories}</dd>
            </div>
          </dl>
        </div>

        <div className="library-results" id="library-results">
          {sortedBooks.length === 0 && activeFilterCount > 0 ? (
            <LibraryNoFilterMatches onClearFilters={handleLibraryFiltersClear} />
          ) : (
            <LibraryGrid books={sortedBooks} />
          )}
        </div>
        {warnings.length > 0 ? <RuntimeWarnings warnings={warnings} /> : null}
      </section>

      {runtimeMetrics.books.length > 0 ? (
        <aside className="library-sidebar" aria-label="Filtros da biblioteca">
          <LibraryFilterControls
            activeFilterCount={activeFilterCount}
            filters={activeFilters}
            groups={filterOptions}
            resultCount={filteredBooks.length}
            totalCount={runtimeMetrics.books.length}
            onClearFilters={handleLibraryFiltersClear}
            onToggleFilter={handleLibraryFilterToggle}
          />
        </aside>
      ) : null}
    </>
  );
}

function LibraryNoFilterMatches({ onClearFilters }) {
  return (
    <div className="library-filter-empty-state" role="status">
      <span className="library-empty-mark" aria-hidden="true">
        0
      </span>
      <div>
        <h3>Nenhum livro com esses filtros</h3>
        <p>
          Os livros continuam carregados. Limpe os filtros ou remova uma opcao para
          ver o acervo novamente.
        </p>
      </div>
      <button
        className="button-link button-link-primary"
        type="button"
        aria-controls="library-results"
        onClick={onClearFilters}
      >
        Limpar filtros
      </button>
    </div>
  );
}

function RuntimeWarnings({ warnings }) {
  return (
    <details className="runtime-warnings">
      <summary>{formatWarningCount(warnings.length)}</summary>
      <p className="runtime-warning-note">
        A biblioteca abriu, mas encontrou inconsistencias recuperaveis. Revise os
        arquivos indicados antes do proximo commit de dados.
      </p>
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
  const titleId = useId();

  return (
    <section className="page-layout" aria-labelledby={titleId}>
      <div className="page-header">
        <div className="page-copy">
          <p className="eyebrow">{eyebrow}</p>
          <h1 id={titleId}>{title}</h1>
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

function formatLibraryErrorMessage(error) {
  const message = error?.message || '';

  if (!message || message === 'Library data could not be loaded.') {
    return 'A biblioteca encontrou um JSON invalido, um caminho inesperado ou um dado obrigatorio ausente.';
  }

  return message;
}

export default App;
