import React from 'react';
import { NavLink, Route, Routes, useParams } from 'react-router';

const navItems = [
  { to: '/', label: 'Biblioteca', end: true },
  { to: '/new/book', label: 'Novo livro' },
  { to: '/new/strike', label: 'Novo strike' },
  { to: '/new/category', label: 'Nova categoria' },
];

const generatorPages = {
  book: {
    title: 'Novo livro',
    entity: 'book',
    path: 'data/books/{slug}.json',
  },
  strike: {
    title: 'Novo strike',
    entity: 'strike',
    path: 'data/strikes/{book-slug}/{date}.json',
  },
  category: {
    title: 'Nova categoria',
    entity: 'category',
    path: 'data/categories/{slug}.json',
  },
};

function App() {
  return (
    <div className="app">
      <header>
        <p className="project-label">Reading Progress Engine</p>

        <nav aria-label="Navegacao principal">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              className={({ isActive }) => (isActive ? 'active' : undefined)}
              end={item.end}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main>
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
    <Page title="Biblioteca">
      <p>Scaffold inicial da aplicacao web.</p>
    </Page>
  );
}

function BookDetailPage() {
  const { slug } = useParams();

  return (
    <Page title="Detalhe do livro">
      <p>Rota reservada para o livro: {slug}</p>
    </Page>
  );
}

function GeneratorPage({ type }) {
  const page = generatorPages[type];

  return (
    <Page title={page.title}>
      <p>Gerador futuro de JSON para {page.entity}.</p>
      <code>{page.path}</code>
    </Page>
  );
}

function NotFoundPage() {
  return (
    <Page title="Pagina indisponivel">
      <p>Rota nao encontrada.</p>
    </Page>
  );
}

function Page({ title, children }) {
  return (
    <section className="page">
      <h1>{title}</h1>
      {children}
    </section>
  );
}

export default App;
