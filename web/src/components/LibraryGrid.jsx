import React from 'react';
import { Link } from 'react-router';

import BookCard from './BookCard.jsx';

function LibraryGrid({ books = [] }) {
  if (books.length === 0) {
    return (
      <div className="library-empty" role="status">
        <span className="library-empty-mark" aria-hidden="true">
          +
        </span>
        <div>
          <h3>Nenhum livro registrado</h3>
          <p>Adicione o primeiro JSON de livro para iniciar sua biblioteca.</p>
        </div>
        <Link className="button-link button-link-primary" to="/new/book">
          Criar primeiro livro
        </Link>
      </div>
    );
  }

  return (
    <ul className="library-grid" aria-label="Livros da biblioteca">
      {books.map((book) => (
        <li key={book.slug}>
          <BookCard book={book} />
        </li>
      ))}
    </ul>
  );
}

export default LibraryGrid;
