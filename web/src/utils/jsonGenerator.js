const FIELD_ORDER = {
  book: [
    'title',
    'author',
    'totalPages',
    'currentPage',
    'status',
    'category',
    'genres',
    'language',
    'startDate',
    'endDate',
    'isbn',
    'publisher',
    'year',
    'notes',
    'tags',
    'coverUrl',
  ],
  strike: [
    'book',
    'date',
    'startPage',
    'endPage',
    'pagesRead',
    'chapter',
    'duration',
    'notes',
    'mood',
  ],
  category: ['name', 'slug', 'description', 'color'],
};

export function createBookJson(input) {
  return orderFields(
    {
      currentPage: 0,
      status: 'to-read',
      ...input,
    },
    FIELD_ORDER.book
  );
}

export function createStrikeJson(input) {
  const pagesRead = input.pagesRead ?? calculatePagesRead(input.startPage, input.endPage);

  return orderFields(
    {
      ...input,
      pagesRead,
    },
    FIELD_ORDER.strike
  );
}

export function createCategoryJson(input) {
  return orderFields(input, FIELD_ORDER.category);
}

export function toJsonString(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function calculatePagesRead(startPage, endPage) {
  const start = toInteger(startPage);
  const end = toInteger(endPage);

  if (start === undefined || end === undefined) {
    return undefined;
  }

  return end - start;
}

function orderFields(source, fields) {
  const output = {};

  for (const field of fields) {
    const value = source[field];

    if (shouldIncludeValue(value)) {
      output[field] = value;
    }
  }

  return output;
}

function shouldIncludeValue(value) {
  return value !== undefined && value !== '';
}

function toInteger(value) {
  const number = Number(value);

  if (!Number.isInteger(number)) {
    return undefined;
  }

  return number;
}
