import libraryJson from '../../../data/library.json' with { type: 'json' };

import {
  createLibrarySourceFromModuleMaps,
  isValidLibrarySlug,
} from './libraryDiscovery.js';

export const LIBRARY_LOAD_STATUS = {
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
};

const bookModules = import.meta.glob('../../../data/books/*.json', {
  eager: true,
  import: 'default',
});

const categoryModules = import.meta.glob('../../../data/categories/*.json', {
  eager: true,
  import: 'default',
});

const strikeModules = import.meta.glob('../../../data/strikes/**/*.json', {
  eager: true,
  import: 'default',
});

const AUTOMATIC_LIBRARY_SOURCE = createLibrarySourceFromModuleMaps({
  strategy: 'vite-import-meta-glob',
  books: bookModules,
  categories: categoryModules,
  strikes: strikeModules,
  library: {
    path: '../../../data/library.json',
    data: libraryJson,
  },
});

export function createLibraryLoadingState() {
  return {
    status: LIBRARY_LOAD_STATUS.LOADING,
    data: null,
    error: null,
  };
}

export function loadLibraryData(source = AUTOMATIC_LIBRARY_SOURCE) {
  try {
    return {
      status: LIBRARY_LOAD_STATUS.SUCCESS,
      data: normalizeLibraryData(source),
      error: null,
    };
  } catch (error) {
    return {
      status: LIBRARY_LOAD_STATUS.ERROR,
      data: null,
      error: toRecoverableLibraryError(error),
    };
  }
}

export function normalizeLibraryData(source) {
  const fatalErrors = [];
  const books = normalizeEntityEntries(source?.books, 'book', fatalErrors);
  const categories = normalizeEntityEntries(source?.categories, 'category', fatalErrors);
  const strikes = normalizeStrikeEntries(source?.strikes, fatalErrors);
  const library = normalizeLibraryEntry(source?.library, fatalErrors);

  if (fatalErrors.length > 0) {
    throw new LibraryLoaderError('Library data could not be loaded.', fatalErrors);
  }

  const booksBySlug = createEntityMap(books, 'book');
  const categoriesBySlug = createEntityMap(categories, 'category');
  const strikesByBook = groupStrikesByBook(books, strikes);
  const libraryBooks = normalizeLibraryBooks(library.data.books);
  const libraryBooksBySlug = createLibraryBookMap(libraryBooks);
  const warnings = collectLibraryWarnings({
    books,
    booksBySlug,
    categories,
    categoriesBySlug,
    strikes,
    strikesByBook,
    library,
    libraryBooks,
    libraryBooksBySlug,
  });

  const normalizedBooks = books.map((book) => ({
    ...book,
    category: categoriesBySlug.get(book.data.category) || null,
    libraryBook: libraryBooksBySlug.get(book.slug) || null,
    strikes: strikesByBook.get(book.slug) || [],
  }));

  return {
    source: {
      strategy: source.strategy || 'unknown',
      paths: {
        books: normalizedBooks.map((book) => book.path),
        categories: categories.map((category) => category.path),
        strikes: strikes.map((strike) => strike.path),
        library: library.path,
      },
    },
    summary: {
      totalBooks: normalizedBooks.length,
      totalCategories: categories.length,
      totalStrikes: strikes.length,
      generatedAt: library.data.generatedAt || null,
      libraryTotalBooks: numberOrNull(library.data.totalBooks),
      libraryTotalPagesRead: numberOrNull(library.data.totalPagesRead),
      warningCount: warnings.length,
    },
    books: normalizedBooks,
    booksBySlug: new Map(normalizedBooks.map((book) => [book.slug, book])),
    categories,
    categoriesBySlug,
    strikes,
    strikesByBook,
    library,
    libraryBooks,
    libraryBooksBySlug,
    orphanStrikes: strikes.filter((strike) => !booksBySlug.has(strike.data.book)),
    warnings,
  };
}

export function createLibraryDataSnapshot(data) {
  return {
    summary: data.summary,
    bookSlugs: data.books.map((book) => book.slug),
    categorySlugs: data.categories.map((category) => category.slug),
    strikeIds: data.strikes.map((strike) => strike.id),
    libraryBookSlugs: data.libraryBooks.map((book) => book.slug),
    warnings: [...data.warnings].sort(compareText),
  };
}

class LibraryLoaderError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = 'LibraryLoaderError';
    this.details = details;
  }
}

function normalizeEntityEntries(entries, label, fatalErrors) {
  if (!Array.isArray(entries)) {
    fatalErrors.push(`${label} source must be an array`);
    return [];
  }

  const seen = new Set();
  const normalized = [];

  for (const entry of entries) {
    if (!isSourceEntry(entry)) {
      fatalErrors.push(`${label} source entry must include slug, path and data`);
      continue;
    }

    if (!isValidLibrarySlug(entry.slug)) {
      fatalErrors.push(`${entry.path}: source slug "${entry.slug}" is not valid`);
    }

    if (seen.has(entry.slug)) {
      fatalErrors.push(`${entry.path}: duplicate ${label} slug "${entry.slug}"`);
      continue;
    }

    seen.add(entry.slug);
    normalized.push({
      slug: entry.slug,
      path: entry.path,
      data: entry.data,
    });
  }

  return normalized.sort((left, right) => compareText(left.slug, right.slug));
}

function normalizeStrikeEntries(entries, fatalErrors) {
  if (!Array.isArray(entries)) {
    fatalErrors.push('strike source must be an array');
    return [];
  }

  const seen = new Set();
  const normalized = [];

  for (const entry of entries) {
    if (!isStrikeSourceEntry(entry)) {
      fatalErrors.push('strike source entry must include bookSlug, path and data');
      continue;
    }

    if (!isValidLibrarySlug(entry.bookSlug)) {
      fatalErrors.push(`${entry.path}: source book slug "${entry.bookSlug}" is not valid`);
    }

    const fileName = entry.fileName || getFileName(entry.path);
    const fileStem = entry.fileStem || fileName.replace(/\.json$/, '');
    const id = `${entry.bookSlug}/${fileName}`;

    if (seen.has(id)) {
      fatalErrors.push(`${entry.path}: duplicate strike id "${id}"`);
      continue;
    }

    seen.add(id);
    normalized.push({
      id,
      bookSlug: entry.bookSlug,
      fileName,
      fileStem,
      path: entry.path,
      data: entry.data,
    });
  }

  return normalized.sort(compareStrikeRecords);
}

function normalizeLibraryEntry(entry, fatalErrors) {
  if (!entry || typeof entry.path !== 'string' || !isPlainObject(entry.data)) {
    fatalErrors.push('library source entry must include path and data');
    return {
      path: 'data/library.json',
      data: {},
    };
  }

  return {
    path: entry.path,
    data: entry.data,
  };
}

function normalizeLibraryBooks(libraryBooks) {
  if (!Array.isArray(libraryBooks)) {
    return [];
  }

  return [...libraryBooks]
    .filter((book) => isPlainObject(book) && typeof book.slug === 'string')
    .sort((left, right) => compareText(left.slug, right.slug));
}

function createEntityMap(records, label) {
  const map = new Map();

  for (const record of records) {
    if (map.has(record.slug)) {
      throw new LibraryLoaderError(`Duplicate ${label} slug "${record.slug}".`, [record.path]);
    }

    map.set(record.slug, record);
  }

  return map;
}

function createLibraryBookMap(libraryBooks) {
  const map = new Map();

  for (const book of libraryBooks) {
    map.set(book.slug, book);
  }

  return map;
}

function groupStrikesByBook(books, strikes) {
  const groups = new Map(books.map((book) => [book.slug, []]));

  for (const strike of strikes) {
    const groupSlug = strike.data.book || strike.bookSlug;

    if (!groups.has(groupSlug)) {
      groups.set(groupSlug, []);
    }

    groups.get(groupSlug).push(strike);
  }

  for (const [slug, group] of groups.entries()) {
    groups.set(slug, [...group].sort(compareStrikeRecords));
  }

  return groups;
}

function collectLibraryWarnings(context) {
  return [
    ...collectCategoryWarnings(context.categories),
    ...collectBookWarnings(context.books, context.categoriesBySlug, context.libraryBooksBySlug),
    ...collectStrikeWarnings(context.strikes, context.booksBySlug),
    ...collectGeneratedLibraryWarnings(context),
  ].sort(compareText);
}

function collectCategoryWarnings(categories) {
  const warnings = [];

  for (const category of categories) {
    if (category.data.slug !== category.slug) {
      warnings.push(`${category.path}: category.slug does not match file slug "${category.slug}"`);
    }
  }

  return warnings;
}

function collectBookWarnings(books, categoriesBySlug, libraryBooksBySlug) {
  const warnings = [];

  for (const book of books) {
    if (!categoriesBySlug.has(book.data.category)) {
      warnings.push(`${book.path}: category "${book.data.category}" was not loaded`);
    }

    if (!libraryBooksBySlug.has(book.slug)) {
      warnings.push(`${book.path}: generated library summary was not loaded`);
    }

    if (book.data.currentPage > book.data.totalPages) {
      warnings.push(`${book.path}: currentPage is greater than totalPages`);
    }
  }

  return warnings;
}

function collectStrikeWarnings(strikes, booksBySlug) {
  const warnings = [];

  for (const strike of strikes) {
    if (strike.data.book !== strike.bookSlug) {
      warnings.push(`${strike.path}: strike.book does not match source folder "${strike.bookSlug}"`);
    }

    if (!booksBySlug.has(strike.data.book)) {
      warnings.push(`${strike.path}: related book "${strike.data.book}" was not loaded`);
    }

    if (strike.data.pagesRead !== strike.data.endPage - strike.data.startPage) {
      warnings.push(`${strike.path}: pagesRead does not match endPage - startPage`);
    }
  }

  return warnings;
}

function collectGeneratedLibraryWarnings({
  books,
  strikesByBook,
  library,
  libraryBooks,
  libraryBooksBySlug,
}) {
  const warnings = [];

  if (library.data.totalBooks !== books.length) {
    warnings.push(`${library.path}: totalBooks does not match loaded books`);
  }

  const bookSlugs = books.map((book) => book.slug);
  const libraryBookSlugs = libraryBooks.map((book) => book.slug);

  for (const slug of bookSlugs) {
    const libraryBook = libraryBooksBySlug.get(slug);

    if (!libraryBook) {
      continue;
    }

    const strikes = strikesByBook.get(slug) || [];
    const totalPagesRead = strikes.reduce((total, strike) => total + strike.data.pagesRead, 0);

    if (libraryBook.totalStrikes !== strikes.length) {
      warnings.push(`${library.path}: ${slug} totalStrikes does not match loaded strikes`);
    }

    if (libraryBook.totalPagesRead !== totalPagesRead) {
      warnings.push(`${library.path}: ${slug} totalPagesRead does not match loaded strikes`);
    }
  }

  for (const slug of libraryBookSlugs) {
    if (!bookSlugs.includes(slug)) {
      warnings.push(`${library.path}: generated library includes unknown book "${slug}"`);
    }
  }

  return warnings;
}

function toRecoverableLibraryError(error) {
  return {
    name: error?.name || 'Error',
    message: error?.message || 'Library data could not be loaded.',
    details: Array.isArray(error?.details) ? error.details : [],
  };
}

function isSourceEntry(entry) {
  return (
    isPlainObject(entry) &&
    typeof entry.slug === 'string' &&
    typeof entry.path === 'string' &&
    isPlainObject(entry.data)
  );
}

function isStrikeSourceEntry(entry) {
  return (
    isPlainObject(entry) &&
    typeof entry.bookSlug === 'string' &&
    typeof entry.path === 'string' &&
    isPlainObject(entry.data)
  );
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function getFileName(path) {
  return path.split('/').pop() || path;
}

function numberOrNull(value) {
  return Number.isFinite(value) ? value : null;
}

function compareStrikeRecords(left, right) {
  const byBook = compareText(left.bookSlug, right.bookSlug);

  if (byBook !== 0) {
    return byBook;
  }

  const byDate = compareText(left.data.date || '', right.data.date || '');

  if (byDate !== 0) {
    return byDate;
  }

  return compareText(left.path, right.path);
}

function compareText(left, right) {
  const leftText = String(left);
  const rightText = String(right);

  if (leftText < rightText) {
    return -1;
  }

  if (leftText > rightText) {
    return 1;
  }

  return 0;
}
