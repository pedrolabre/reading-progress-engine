import { getStrikeFileInfo } from './filePaths.js';
import { calculatePagesRead, createStrikeJson, toJsonString } from './jsonGenerator.js';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function createInitialStrikeFormValues() {
  return {
    book: '',
    date: getLocalDateInputValue(),
    startPage: '',
    endPage: '',
    pagesRead: '',
    chapter: '',
    duration: '',
    notes: '',
    mood: '',
    sequence: '1',
  };
}

export function createStrikeFormOutput(values) {
  const normalized = normalizeStrikeFormValues(values);
  const errors = validateStrikeForm(normalized);
  const fileInfo = createStrikeFileInfo(normalized);
  const isValid = Object.keys(errors).length === 0;
  const data = isValid ? createStrikeJson(toStrikeJsonInput(normalized)) : null;

  return {
    data,
    errors,
    fileInfo,
    isValid,
    json: data ? toJsonString(data) : '',
    normalized,
    pagesRead: normalized.pagesRead,
  };
}

export function getLocalDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function normalizeStrikeFormValues(values) {
  const startPage = parseInteger(values.startPage);
  const endPage = parseInteger(values.endPage);
  const pagesRead = calculatePagesRead(startPage, endPage);

  return {
    book: cleanText(values.book),
    date: cleanText(values.date),
    startPage,
    endPage,
    pagesRead,
    chapter: cleanText(values.chapter),
    duration: parseInteger(values.duration),
    notes: cleanText(values.notes),
    mood: cleanText(values.mood),
    sequence: parseSequence(values.sequence),
    rawText: {
      chapter: String(values.chapter ?? ''),
      notes: String(values.notes ?? ''),
      mood: String(values.mood ?? ''),
    },
  };
}

function validateStrikeForm(values) {
  const errors = {};

  if (!values.book) {
    errors.book = 'Informe o slug do livro.';
  } else if (!SLUG_PATTERN.test(values.book)) {
    errors.book = 'Use slug em kebab-case, sem espacos ou acentos.';
  }

  if (!values.date) {
    errors.date = 'Informe a data do strike.';
  } else if (!isValidDate(values.date)) {
    errors.date = 'Use uma data real no formato YYYY-MM-DD.';
  }

  if (values.startPage === undefined) {
    errors.startPage = 'Informe a pagina inicial.';
  } else if (!Number.isInteger(values.startPage)) {
    errors.startPage = 'Use um numero inteiro.';
  } else if (values.startPage < 0) {
    errors.startPage = 'A pagina inicial nao pode ser negativa.';
  }

  if (values.endPage === undefined) {
    errors.endPage = 'Informe a pagina final.';
  } else if (!Number.isInteger(values.endPage)) {
    errors.endPage = 'Use um numero inteiro.';
  } else if (values.endPage < 1) {
    errors.endPage = 'Use pelo menos 1 como pagina final.';
  }

  if (
    Number.isInteger(values.startPage) &&
    Number.isInteger(values.endPage) &&
    values.endPage <= values.startPage
  ) {
    errors.endPage = 'A pagina final precisa ser maior que a inicial.';
    errors.pagesRead = 'pagesRead precisa ser pelo menos 1.';
  } else if (!Number.isInteger(values.pagesRead)) {
    errors.pagesRead = 'pagesRead sera calculado apos paginas validas.';
  } else if (values.pagesRead < 1) {
    errors.pagesRead = 'pagesRead precisa ser pelo menos 1.';
  }

  if (values.duration !== undefined) {
    if (!Number.isInteger(values.duration)) {
      errors.duration = 'Use duracao em minutos inteiros.';
    } else if (values.duration < 1) {
      errors.duration = 'Use pelo menos 1 minuto.';
    }
  }

  validateOptionalText(errors, 'chapter', values.rawText.chapter, 'Capitulo');
  validateOptionalText(errors, 'notes', values.rawText.notes, 'Notas');
  validateOptionalText(errors, 'mood', values.rawText.mood, 'Mood');

  if (values.sequence !== undefined) {
    if (!Number.isInteger(values.sequence)) {
      errors.sequence = 'Use uma sequencia inteira.';
    } else if (values.sequence < 1) {
      errors.sequence = 'Use 1 ou maior.';
    }
  }

  return errors;
}

function validateOptionalText(errors, field, rawValue, label) {
  if (rawValue && rawValue.trim() === '') {
    errors[field] = `${label} precisa ter texto ou ficar vazio.`;
  }
}

function createStrikeFileInfo(values) {
  const validBook = SLUG_PATTERN.test(values.book);
  const validDate = isValidDate(values.date);
  const validSequence = Number.isInteger(values.sequence) && values.sequence >= 1;

  if (validBook && validDate && validSequence) {
    return getStrikeFileInfo(values.book, values.date, values.sequence);
  }

  const bookSegment = validBook ? values.book : '{book-slug}';
  const dateSegment = validDate ? values.date : '{date}';
  const sequenceSuffix = validSequence && values.sequence > 1 ? `-${values.sequence}` : '';
  const fileName = `${dateSegment}${sequenceSuffix}.json`;

  return {
    slug: validBook ? values.book : '',
    fileName,
    path: `data/strikes/${bookSegment}/${fileName}`,
  };
}

function toStrikeJsonInput(values) {
  return {
    book: values.book,
    date: values.date,
    startPage: values.startPage,
    endPage: values.endPage,
    chapter: values.chapter || undefined,
    duration: values.duration,
    notes: values.notes || undefined,
    mood: values.mood || undefined,
  };
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

function parseSequence(value) {
  const text = cleanText(value);

  if (!text) {
    return 1;
  }

  return parseInteger(text);
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
