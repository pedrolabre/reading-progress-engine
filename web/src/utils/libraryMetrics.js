const STATUS_COUNT_FIELDS = [
  { status: 'completed', field: 'booksCompleted' },
  { status: 'reading', field: 'booksReading' },
  { status: 'paused', field: 'booksPaused' },
  { status: 'to-read', field: 'booksToRead' },
  { status: 'dropped', field: 'booksDropped' },
];

const BOOK_LIBRARY_NUMBER_FIELDS = [
  { field: 'currentPage', metric: 'currentPage' },
  { field: 'totalPages', metric: 'totalPages' },
  { field: 'progress', metric: 'progress' },
  { field: 'totalStrikes', metric: 'totalStrikes' },
  { field: 'totalPagesRead', metric: 'totalPagesRead' },
  { field: 'averagePagesPerStrike', metric: 'averagePagesPerStrike' },
];

const BOOK_LIBRARY_DATE_FIELDS = [
  { field: 'firstStrike', metric: 'firstStrike' },
  { field: 'lastStrike', metric: 'lastStrike' },
];

const BOOK_LIBRARY_TEXT_FIELDS = [
  { field: 'category', metric: 'category' },
  { field: 'status', metric: 'status' },
];

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function createLibraryMetrics(libraryData) {
  const books = createRuntimeBookMetrics(libraryData);
  const summaryWithoutWarnings = createRuntimeLibrarySummary(libraryData, books);
  const warnings = collectRuntimeMetricWarnings(libraryData, summaryWithoutWarnings, books);
  const summary = {
    ...summaryWithoutWarnings,
    warningCount: warnings.length,
  };

  return {
    summary,
    books,
    booksBySlug: new Map(books.map((book) => [book.slug, book])),
    warnings,
  };
}

export function createRuntimeBookMetrics(libraryData) {
  const bookRecords = Array.isArray(libraryData?.books) ? libraryData.books : [];

  return bookRecords
    .map((bookRecord) => {
      const strikes = getBookStrikes(libraryData, bookRecord);
      return createBookMetricRecord(bookRecord, strikes);
    })
    .sort((left, right) => compareText(left.slug, right.slug));
}

export function createBookMetricRecord(bookRecord, strikes = []) {
  const sortedStrikes = sortStrikeRecords(strikes);
  const metrics = calculateBookMetrics(bookRecord?.data || {}, sortedStrikes);

  return {
    slug: bookRecord?.slug || '',
    path: bookRecord?.path || '',
    data: bookRecord?.data || {},
    category: bookRecord?.category || null,
    libraryBook: bookRecord?.libraryBook || null,
    strikes: sortedStrikes,
    metrics,
  };
}

export function calculateBookMetrics(bookData, strikes = []) {
  const currentPage = toFiniteNumber(bookData.currentPage, 0);
  const totalPages = toFiniteNumber(bookData.totalPages, 0);
  const totalStrikes = strikes.length;
  const totalPagesRead = calculateTotalPagesRead(strikes);
  const firstStrike = getFirstStrikeDate(strikes);
  const lastStrike = getLastStrikeDate(strikes);
  const activityDates = createActivityDates(bookData, firstStrike, lastStrike);

  return {
    title: bookData.title || '',
    author: bookData.author || '',
    category: bookData.category || null,
    status: bookData.status || null,
    currentPage,
    totalPages,
    progressRatio: calculateProgressRatio(currentPage, totalPages),
    progress: calculateBookProgress(currentPage, totalPages),
    totalStrikes,
    totalPagesRead,
    firstStrike,
    lastStrike,
    averagePagesPerStrike: calculateAveragePagesPerStrike(totalPagesRead, totalStrikes),
    activityDates,
  };
}

export function calculateBookProgress(currentPage, totalPages) {
  const current = toFiniteNumber(currentPage, 0);
  const total = toFiniteNumber(totalPages, 0);

  if (total <= 0) {
    return 0;
  }

  return roundTo((current / total) * 100, 2);
}

export function calculateProgressRatio(currentPage, totalPages) {
  const current = toFiniteNumber(currentPage, 0);
  const total = toFiniteNumber(totalPages, 0);

  if (total <= 0) {
    return 0;
  }

  return roundTo(current / total, 4);
}

export function calculateTotalPagesRead(strikes = []) {
  return strikes.reduce((total, strike) => total + toFiniteNumber(strike?.data?.pagesRead, 0), 0);
}

export function calculateAveragePagesPerStrike(totalPagesRead, totalStrikes) {
  if (totalStrikes <= 0) {
    return 0;
  }

  return roundTo(totalPagesRead / totalStrikes, 1);
}

export function createLibraryMetricsSnapshot(metrics) {
  return {
    summary: metrics.summary,
    books: metrics.books.map((book) => ({
      slug: book.slug,
      progress: book.metrics.progress,
      totalStrikes: book.metrics.totalStrikes,
      totalPagesRead: book.metrics.totalPagesRead,
      firstStrike: book.metrics.firstStrike,
      lastStrike: book.metrics.lastStrike,
      averagePagesPerStrike: book.metrics.averagePagesPerStrike,
      firstActivityDate: book.metrics.activityDates.firstActivityDate,
      lastActivityDate: book.metrics.activityDates.lastActivityDate,
    })),
    warnings: [...metrics.warnings].sort(compareText),
  };
}

function createRuntimeLibrarySummary(libraryData, books) {
  const totalStrikes = books.reduce((total, book) => total + book.metrics.totalStrikes, 0);
  const totalPagesRead = books.reduce((total, book) => total + book.metrics.totalPagesRead, 0);
  const totalPages = books.reduce((total, book) => total + book.metrics.totalPages, 0);
  const statusCounts = createStatusCounts(books);
  const activityDates = books
    .flatMap((book) => [
      book.metrics.activityDates.firstActivityDate,
      book.metrics.activityDates.lastActivityDate,
    ])
    .filter(isDateText)
    .sort(compareText);

  return {
    totalBooks: books.length,
    totalCategories: Array.isArray(libraryData?.categories) ? libraryData.categories.length : 0,
    totalStrikes,
    totalPagesRead,
    totalPages,
    booksWithStrikes: books.filter((book) => book.metrics.totalStrikes > 0).length,
    averagePagesPerStrike: calculateAveragePagesPerStrike(totalPagesRead, totalStrikes),
    firstActivityDate: activityDates[0] || null,
    lastActivityDate: activityDates[activityDates.length - 1] || null,
    statusCounts,
  };
}

function createStatusCounts(books) {
  const counts = Object.fromEntries(STATUS_COUNT_FIELDS.map(({ status }) => [status, 0]));

  for (const book of books) {
    const status = book.metrics.status;

    if (Object.prototype.hasOwnProperty.call(counts, status)) {
      counts[status] += 1;
    }
  }

  return counts;
}

function collectRuntimeMetricWarnings(libraryData, summary, books) {
  const libraryPath = libraryData?.library?.path || 'data/library.json';
  const library = libraryData?.library?.data || {};
  const warnings = [];

  compareNumberField(warnings, libraryPath, 'totalBooks', library.totalBooks, summary.totalBooks);
  compareNumberField(
    warnings,
    libraryPath,
    'totalPagesRead',
    library.totalPagesRead,
    summary.totalPagesRead
  );

  for (const { status, field } of STATUS_COUNT_FIELDS) {
    compareNumberField(warnings, libraryPath, field, library[field], summary.statusCounts[status]);
  }

  for (const book of books) {
    const libraryBook = book.libraryBook || libraryData?.libraryBooksBySlug?.get(book.slug);

    if (!libraryBook) {
      continue;
    }

    for (const { field, metric } of BOOK_LIBRARY_NUMBER_FIELDS) {
      compareNumberField(
        warnings,
        libraryPath,
        `${book.slug}.${field}`,
        libraryBook[field],
        book.metrics[metric]
      );
    }

    for (const { field, metric } of BOOK_LIBRARY_DATE_FIELDS) {
      compareValueField(
        warnings,
        libraryPath,
        `${book.slug}.${field}`,
        libraryBook[field],
        book.metrics[metric]
      );
    }

    for (const { field, metric } of BOOK_LIBRARY_TEXT_FIELDS) {
      compareValueField(
        warnings,
        libraryPath,
        `${book.slug}.${field}`,
        libraryBook[field],
        book.metrics[metric]
      );
    }
  }

  return warnings.sort(compareText);
}

function compareNumberField(warnings, path, label, libraryValue, runtimeValue) {
  if (!Number.isFinite(libraryValue)) {
    return;
  }

  if (Math.abs(libraryValue - runtimeValue) > 1e-9) {
    warnings.push(
      `${path}: ${label} differs from runtime metrics (library: ${formatValue(
        libraryValue
      )}; runtime: ${formatValue(runtimeValue)})`
    );
  }
}

function compareValueField(warnings, path, label, libraryValue, runtimeValue) {
  if (libraryValue === undefined) {
    return;
  }

  if (libraryValue !== runtimeValue) {
    warnings.push(
      `${path}: ${label} differs from runtime metrics (library: ${formatValue(
        libraryValue
      )}; runtime: ${formatValue(runtimeValue)})`
    );
  }
}

function getBookStrikes(libraryData, bookRecord) {
  if (Array.isArray(bookRecord?.strikes)) {
    return bookRecord.strikes;
  }

  return libraryData?.strikesByBook?.get(bookRecord?.slug) || [];
}

function sortStrikeRecords(strikes) {
  return [...strikes].sort((left, right) => {
    const byDate = compareText(left?.data?.date || '', right?.data?.date || '');

    if (byDate !== 0) {
      return byDate;
    }

    return compareText(left?.path || left?.id || '', right?.path || right?.id || '');
  });
}

function getFirstStrikeDate(strikes) {
  return strikes.length > 0 ? strikes[0].data.date : null;
}

function getLastStrikeDate(strikes) {
  return strikes.length > 0 ? strikes[strikes.length - 1].data.date : null;
}

function createActivityDates(bookData, firstStrike, lastStrike) {
  const dates = [bookData.startDate, bookData.endDate, firstStrike, lastStrike]
    .filter(isDateText)
    .sort(compareText);

  return {
    startDate: isDateText(bookData.startDate) ? bookData.startDate : null,
    endDate: isDateText(bookData.endDate) ? bookData.endDate : null,
    firstStrike,
    lastStrike,
    firstActivityDate: dates[0] || null,
    lastActivityDate: dates[dates.length - 1] || null,
  };
}

function isDateText(value) {
  return typeof value === 'string' && DATE_PATTERN.test(value);
}

function toFiniteNumber(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

function roundTo(value, decimals) {
  return Number(value.toFixed(decimals));
}

function formatValue(value) {
  if (value === null) {
    return 'null';
  }

  if (typeof value === 'string') {
    return `"${value}"`;
  }

  return String(value);
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
