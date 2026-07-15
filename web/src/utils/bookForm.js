import { getBookFileInfo } from './filePaths.js';
import { createBookJson, toJsonString } from './jsonGenerator.js';
import { slugify } from './slugify.js';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LANGUAGE_PATTERN = /^[a-z]{2}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const ISBN_PATTERN = /^(?:97[89][ -]?)?(?:[0-9][ -]?){9}[0-9Xx]$/;

export const BOOK_STATUS_OPTIONS = [
  { value: 'to-read', label: 'to-read' },
  { value: 'reading', label: 'reading' },
  { value: 'paused', label: 'paused' },
  { value: 'completed', label: 'completed' },
  { value: 'dropped', label: 'dropped' },
];

export const INITIAL_BOOK_FORM_VALUES = {
  title: '',
  author: '',
  totalPages: '',
  currentPage: '0',
  status: 'to-read',
  category: '',
  genres: '',
  language: '',
  startDate: '',
  endDate: '',
  isbn: '',
  publisher: '',
  year: '',
  notes: '',
  tags: '',
  coverUrl: '',
};

export function createBookFormOutput(values) {
  const normalized = normalizeBookFormValues(values);
  const slug = createSlug(normalized.title);
  const fileInfo = slug
    ? getBookFileInfo(slug)
    : { slug: '', fileName: '{slug}.json', path: 'data/books/{slug}.json' };
  const errors = validateBookForm(normalized, slug);
  const suggestions = createBookSuggestions(normalized);
  const isValid = Object.keys(errors).length === 0;
  const data = isValid ? createBookJson(toBookJsonInput(normalized)) : null;

  return {
    data,
    errors,
    fileInfo,
    isValid,
    json: data ? toJsonString(data) : '',
    normalized,
    slug,
    suggestions,
  };
}

function normalizeBookFormValues(values) {
  return {
    title: cleanText(values.title),
    author: cleanText(values.author),
    totalPages: parseInteger(values.totalPages),
    currentPage: parseInteger(values.currentPage),
    status: cleanText(values.status),
    category: cleanText(values.category),
    genres: parseSlugList(values.genres),
    language: cleanText(values.language),
    startDate: cleanText(values.startDate),
    endDate: cleanText(values.endDate),
    isbn: cleanText(values.isbn),
    publisher: cleanText(values.publisher),
    year: parseInteger(values.year),
    notes: cleanText(values.notes),
    tags: parseSlugList(values.tags),
    coverUrl: cleanText(values.coverUrl),
  };
}

function validateBookForm(values, slug) {
  const errors = {};

  if (!values.title) {
    errors.title = 'Informe o titulo.';
  } else if (!slug) {
    errors.title = 'O titulo precisa gerar um slug valido.';
  }

  if (!values.author) {
    errors.author = 'Informe o autor.';
  }

  if (values.totalPages === undefined) {
    errors.totalPages = 'Informe o total de paginas.';
  } else if (!Number.isInteger(values.totalPages)) {
    errors.totalPages = 'Use um numero inteiro.';
  } else if (values.totalPages < 1) {
    errors.totalPages = 'Use pelo menos 1 pagina.';
  }

  if (values.currentPage === undefined) {
    errors.currentPage = 'Informe a pagina atual.';
  } else if (!Number.isInteger(values.currentPage)) {
    errors.currentPage = 'Use um numero inteiro.';
  } else if (values.currentPage < 0) {
    errors.currentPage = 'A pagina atual nao pode ser negativa.';
  }

  if (
    Number.isInteger(values.totalPages) &&
    values.totalPages >= 1 &&
    Number.isInteger(values.currentPage) &&
    values.currentPage > values.totalPages
  ) {
    errors.currentPage = 'A pagina atual nao pode passar do total.';
  }

  if (!BOOK_STATUS_OPTIONS.some((option) => option.value === values.status)) {
    errors.status = 'Escolha um status valido.';
  }

  if (!values.category) {
    errors.category = 'Informe o slug da categoria.';
  } else if (!SLUG_PATTERN.test(values.category)) {
    errors.category = 'Use slug em kebab-case, sem espacos ou acentos.';
  }

  validateSlugList(errors, 'genres', values.genres, 'Generos');
  validateSlugList(errors, 'tags', values.tags, 'Tags');

  if (values.language && !LANGUAGE_PATTERN.test(values.language)) {
    errors.language = 'Use codigo ISO 639-1 com duas letras minusculas.';
  }

  validateDate(errors, 'startDate', values.startDate, 'Use data no formato YYYY-MM-DD.');
  validateDate(errors, 'endDate', values.endDate, 'Use data no formato YYYY-MM-DD.');

  if (
    values.startDate &&
    values.endDate &&
    isValidDate(values.startDate) &&
    isValidDate(values.endDate) &&
    values.endDate < values.startDate
  ) {
    errors.endDate = 'A data final nao pode vir antes da data inicial.';
  }

  if (values.isbn && !ISBN_PATTERN.test(values.isbn)) {
    errors.isbn = 'Use ISBN-10 ou ISBN-13 com digitos, hifens ou espacos.';
  }

  if (values.year !== undefined) {
    if (!Number.isInteger(values.year)) {
      errors.year = 'Use um ano inteiro.';
    } else if (values.year < 1000 || values.year > 9999) {
      errors.year = 'Use um ano com quatro digitos.';
    }
  }

  if (values.coverUrl && !isValidHttpUrl(values.coverUrl)) {
    errors.coverUrl = 'Use uma URL absoluta com http ou https.';
  }

  return errors;
}

function createBookSuggestions(values) {
  if (values.status !== 'completed') {
    return [];
  }

  const suggestions = [];

  if (
    Number.isInteger(values.totalPages) &&
    values.totalPages >= 1 &&
    Number.isInteger(values.currentPage) &&
    values.currentPage !== values.totalPages
  ) {
    suggestions.push({
      field: 'currentPage',
      id: 'completed-current-page',
      message: `Para completed, currentPage costuma ser igual a totalPages (${values.totalPages}).`,
    });
  }

  if (!values.endDate) {
    suggestions.push({
      field: 'endDate',
      id: 'completed-end-date',
      message: 'Para completed, normalmente vale registrar endDate.',
    });
  }

  return suggestions;
}

function toBookJsonInput(values) {
  return {
    title: values.title,
    author: values.author,
    totalPages: values.totalPages,
    currentPage: values.currentPage,
    status: values.status,
    category: values.category,
    genres: values.genres.length > 0 ? values.genres : undefined,
    language: values.language || undefined,
    startDate: values.startDate || undefined,
    endDate: values.endDate || undefined,
    isbn: values.isbn || undefined,
    publisher: values.publisher || undefined,
    year: values.year,
    notes: values.notes || undefined,
    tags: values.tags.length > 0 ? values.tags : undefined,
    coverUrl: values.coverUrl || undefined,
  };
}

function validateDate(errors, field, value, message) {
  if (value && !isValidDate(value)) {
    errors[field] = message;
  }
}

function validateSlugList(errors, field, list, label) {
  if (list.length === 0) {
    return;
  }

  const invalid = list.find((item) => !SLUG_PATTERN.test(item));

  if (invalid) {
    errors[field] = `${label}: "${invalid}" nao e um slug valido.`;
    return;
  }

  const duplicate = list.find((item, index) => list.indexOf(item) !== index);

  if (duplicate) {
    errors[field] = `${label}: "${duplicate}" aparece mais de uma vez.`;
  }
}

function parseSlugList(value) {
  return cleanText(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseInteger(value) {
  const text = cleanText(value);

  if (!text) {
    return undefined;
  }

  if (!/^-?\d+$/.test(text)) {
    return Number.NaN;
  }

  return Number(text);
}

function createSlug(value) {
  if (!value) {
    return '';
  }

  try {
    return slugify(value);
  } catch {
    return '';
  }
}

function cleanText(value) {
  return String(value ?? '').trim();
}

function isValidDate(value) {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function isValidHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
