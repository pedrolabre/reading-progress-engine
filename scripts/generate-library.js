'use strict';

const fs = require('fs');
const path = require('path');

const {
  DEFAULT_ROOT,
  relativePath,
  validateJsonSchema,
  validateProject,
} = require('./validate');

function buildLibrary(rootDir = DEFAULT_ROOT) {
  const validation = validateProject(rootDir, { includeLibrary: false });

  if (!validation.ok) {
    const details = validation.errors.map((error) => `- ${error}`).join('\n');
    throw new Error(`Cannot generate library from invalid data:\n${details}`);
  }

  const books = Array.from(validation.data.books.values())
    .sort((left, right) => left.slug.localeCompare(right.slug))
    .map((book) => buildLibraryBook(book, validation.data.strikesByBook.get(book.slug) || []));

  const library = {
    generatedAt: deriveGeneratedAt(validation.data),
    totalBooks: books.length,
    totalPagesRead: books.reduce((total, book) => total + book.totalPagesRead, 0),
    booksCompleted: countByStatus(books, 'completed'),
    booksReading: countByStatus(books, 'reading'),
    booksPaused: countByStatus(books, 'paused'),
    booksToRead: countByStatus(books, 'to-read'),
    booksDropped: countByStatus(books, 'dropped'),
    books,
  };

  const schemaErrors = validateJsonSchema(library, validation.schemas.library, 'data/library.json');

  if (schemaErrors.length > 0) {
    const details = schemaErrors.map((error) => `- ${error}`).join('\n');
    throw new Error(`Generated library does not match schemas/library.schema.json:\n${details}`);
  }

  return library;
}

function buildLibraryBook(book, strikes) {
  const sortedStrikes = sortStrikes(strikes);
  const totalPagesRead = sortedStrikes.reduce((total, strike) => total + strike.data.pagesRead, 0);
  const totalStrikes = sortedStrikes.length;

  return {
    slug: book.slug,
    title: book.data.title,
    author: book.data.author,
    category: book.data.category,
    status: book.data.status,
    totalPages: book.data.totalPages,
    currentPage: book.data.currentPage,
    progress: roundTo(book.data.currentPage / book.data.totalPages * 100, 2),
    totalStrikes,
    totalPagesRead,
    firstStrike: totalStrikes > 0 ? sortedStrikes[0].data.date : null,
    lastStrike: totalStrikes > 0 ? sortedStrikes[totalStrikes - 1].data.date : null,
    averagePagesPerStrike: totalStrikes > 0 ? roundTo(totalPagesRead / totalStrikes, 1) : 0,
  };
}

function sortStrikes(strikes) {
  return [...strikes].sort((left, right) => {
    const byDate = left.data.date.localeCompare(right.data.date);

    if (byDate !== 0) {
      return byDate;
    }

    return left.filePath.localeCompare(right.filePath);
  });
}

function countByStatus(books, status) {
  return books.filter((book) => book.status === status).length;
}

function roundTo(value, decimals) {
  return Number(value.toFixed(decimals));
}

function deriveGeneratedAt(data) {
  const dates = [];

  for (const book of data.books.values()) {
    if (typeof book.data.startDate === 'string') {
      dates.push(book.data.startDate);
    }

    if (typeof book.data.endDate === 'string') {
      dates.push(book.data.endDate);
    }
  }

  for (const strikes of data.strikesByBook.values()) {
    for (const strike of strikes) {
      dates.push(strike.data.date);
    }
  }

  dates.sort();

  const referenceDate = dates[dates.length - 1] || '1970-01-01';
  return `${referenceDate}T00:00:00Z`;
}

function writeLibrary(rootDir = DEFAULT_ROOT) {
  const library = buildLibrary(rootDir);
  const outputPath = path.join(rootDir, 'data', 'library.json');

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(library, null, 2)}\n`, 'utf8');

  return { library, outputPath };
}

function printGenerationResult(result, rootDir = DEFAULT_ROOT) {
  const totalStrikes = result.library.books.reduce((total, book) => total + book.totalStrikes, 0);

  console.log(`Generated ${relativePath(rootDir, result.outputPath)}`);
  console.log(`Books: ${result.library.totalBooks}`);
  console.log(`Strikes: ${totalStrikes}`);
  console.log(`Total pages read: ${result.library.totalPagesRead}`);
}

if (require.main === module) {
  try {
    const result = writeLibrary(DEFAULT_ROOT);
    printGenerationResult(result, DEFAULT_ROOT);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = {
  buildLibrary,
  writeLibrary,
};
