import React from 'react';
import { Link, NavLink, Route, Routes, useParams } from 'react-router';

import CopyButton from './components/CopyButton.jsx';
import DownloadButton from './components/DownloadButton.jsx';
import FileInfo from './components/FileInfo.jsx';
import JsonPreview from './components/JsonPreview.jsx';
import {
  createBookJson,
  createCategoryJson,
  createStrikeJson,
  toJsonString,
} from './utils/jsonGenerator.js';
import {
  getBookFileInfo,
  getCategoryFileInfo,
  getStrikeFileInfo,
} from './utils/filePaths.js';

const navItems = [
  { to: '/', label: 'Biblioteca', end: true },
  { to: '/new/book', label: 'Novo livro' },
  { to: '/new/strike', label: 'Novo strike' },
  { to: '/new/category', label: 'Nova categoria' },
];

const generatorPages = {
  book: {
    title: 'Novo livro',
    entity: 'Book',
    description: 'Metadados de leitura em um arquivo JSON por livro.',
    filename: '{slug}.json',
    path: 'data/books/{slug}.json',
    fields: ['Titulo', 'Autor', 'Total de paginas', 'Status', 'Categoria'],
  },
  strike: {
    title: 'Novo strike',
    entity: 'Strike',
    description: 'Sessao de leitura vinculada a um livro pelo slug.',
    filename: '{date}.json',
    path: 'data/strikes/{book-slug}/{date}.json',
    fields: ['Livro', 'Data', 'Pagina inicial', 'Pagina final', 'Paginas lidas'],
  },
  category: {
    title: 'Nova categoria',
    entity: 'Category',
    description: 'Agrupamento principal usado para organizar a biblioteca.',
    filename: '{slug}.json',
    path: 'data/categories/{slug}.json',
    fields: ['Nome', 'Slug', 'Descricao', 'Cor'],
  },
};

const generatorExamples = {
  book: createExample(
    createBookJson({
      title: 'A Wizard of Earthsea',
      author: 'Ursula K. Le Guin',
      totalPages: 205,
      currentPage: 64,
      status: 'reading',
      category: 'fantasy',
      genres: ['fantasy', 'classic'],
      language: 'en',
      tags: ['earthsea'],
    }),
    getBookFileInfo('A Wizard of Earthsea')
  ),
  strike: createExample(
    createStrikeJson({
      book: 'a-wizard-of-earthsea',
      date: '2026-07-11',
      startPage: 64,
      endPage: 91,
      chapter: 'The School for Wizards',
      duration: 42,
      mood: 'focused',
    }),
    getStrikeFileInfo('a-wizard-of-earthsea', '2026-07-11')
  ),
  category: createCategoryExample(),
};

function createCategoryExample() {
  const fileInfo = getCategoryFileInfo('Speculative Fiction');

  return createExample(
    createCategoryJson({
      name: 'Speculative Fiction',
      slug: fileInfo.slug,
      description: 'Fiction that bends reality through imagined worlds, futures or rules.',
      color: '#70B7FF',
    }),
    fileInfo
  );
}

function createExample(data, fileInfo) {
  return {
    data,
    fileInfo,
    json: toJsonString(data),
  };
}

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
          <Route path="new/book" element={<GeneratorPage type="book" />} />
          <Route path="new/strike" element={<GeneratorPage type="strike" />} />
          <Route path="new/category" element={<GeneratorPage type="category" />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  );
}

function LibraryPage() {
  return (
    <Page
      eyebrow="Biblioteca"
      title="Historico de leitura em dados"
      description="A home fica reservada para a biblioteca visual do MVP, mantendo os dados no repositorio e o commit sob controle manual."
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
      <section className="content-grid" aria-label="Areas da biblioteca">
        <article className="panel panel-feature">
          <p className="panel-label">Biblioteca</p>
          <h2>Base pronta para cards de livros</h2>
          <p>
            O espaco principal ja acomoda estado vazio, resumo e futuras listas
            de livros sem depender de backend ou conta.
          </p>
          <div className="metric-row" aria-label="Rotas preparadas">
            <MetricCard value="5" label="rotas do MVP" />
            <MetricCard value="3" label="geradores" />
            <MetricCard value="0" label="salvamentos automaticos" />
          </div>
        </article>

        <aside className="panel panel-compact" aria-label="Acoes principais">
          <p className="panel-label">Geracao</p>
          <h2>Arquivos JSON</h2>
          <RouteList />
        </aside>
      </section>
    </Page>
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

function GeneratorPage({ type }) {
  const page = generatorPages[type];
  const example = generatorExamples[type];

  return (
    <Page
      eyebrow="Gerador"
      title={page.title}
      description={page.description}
    >
      <section className="generator-layout">
        <article className="panel">
          <p className="panel-label">Campos planejados</p>
          <h2>{page.entity}</h2>
          <ul className="field-list">
            {page.fields.map((field) => (
              <li key={field}>{field}</li>
            ))}
          </ul>
        </article>

        <aside className="panel panel-compact generation-preview">
          <p className="panel-label">Amostra JSON</p>
          <dl className="file-summary">
            <div>
              <dt>Modelo</dt>
              <dd>{page.filename}</dd>
            </div>
            <div>
              <dt>Destino</dt>
              <dd>
                <code className="path-chip">{page.path}</code>
              </dd>
            </div>
          </dl>
          <FileInfo {...example.fileInfo} />
          <div className="file-actions" aria-label={`Acoes para ${example.fileInfo.fileName}`}>
            <CopyButton text={example.json} />
            <DownloadButton content={example.json} fileName={example.fileInfo.fileName} />
          </div>
          <JsonPreview json={example.json} title={`${page.entity} JSON`} />
        </aside>
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
