import { getCategoryFileInfo } from './filePaths.js';
import { createCategoryJson, toJsonString } from './jsonGenerator.js';
import { slugify } from './slugify.js';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HEX_COLOR_PATTERN = /^#[0-9A-F]{6}$/;

export const INITIAL_CATEGORY_FORM_VALUES = {
  name: '',
  slug: '',
  description: '',
  color: '#70B7FF',
};

export function createCategoryFormOutput(values) {
  const normalized = normalizeCategoryFormValues(values);
  const errors = validateCategoryForm(normalized);
  const fileInfo = createCategoryFileInfo(normalized.slug);
  const isValid = Object.keys(errors).length === 0;
  const data = isValid ? createCategoryJson(toCategoryJsonInput(normalized)) : null;

  return {
    data,
    errors,
    fileInfo,
    isValid,
    json: data ? toJsonString(data) : '',
    normalized,
    slug: normalized.slug,
  };
}

export function createCategorySlug(value) {
  if (!cleanText(value)) {
    return '';
  }

  try {
    return slugify(value);
  } catch {
    return '';
  }
}

function normalizeCategoryFormValues(values) {
  return {
    name: cleanText(values.name),
    slug: cleanText(values.slug),
    description: cleanText(values.description),
    color: normalizeColor(values.color),
    rawText: {
      description: String(values.description ?? ''),
      color: String(values.color ?? ''),
    },
  };
}

function validateCategoryForm(values) {
  const errors = {};

  if (!values.name) {
    errors.name = 'Informe o nome da categoria.';
  }

  if (!values.slug) {
    errors.slug = 'Informe o slug da categoria.';
  } else if (!SLUG_PATTERN.test(values.slug)) {
    errors.slug = 'Use slug em kebab-case, sem espacos ou acentos.';
  }

  validateOptionalText(errors, 'description', values.rawText.description, 'Descricao');

  if (values.rawText.color && values.rawText.color.trim() === '') {
    errors.color = 'Cor precisa usar #RRGGBB ou ficar vazia.';
  } else if (values.color && !HEX_COLOR_PATTERN.test(values.color)) {
    errors.color = 'Use cor em #RRGGBB, ex: #70B7FF.';
  }

  return errors;
}

function createCategoryFileInfo(slug) {
  if (SLUG_PATTERN.test(slug)) {
    return getCategoryFileInfo(slug);
  }

  return {
    slug: '',
    fileName: '{slug}.json',
    path: 'data/categories/{slug}.json',
  };
}

function toCategoryJsonInput(values) {
  return {
    name: values.name,
    slug: values.slug,
    description: values.description || undefined,
    color: values.color || undefined,
  };
}

function validateOptionalText(errors, field, rawValue, label) {
  if (rawValue && rawValue.trim() === '') {
    errors[field] = `${label} precisa ter texto ou ficar vazia.`;
  }
}

function normalizeColor(value) {
  return cleanText(value).toUpperCase();
}

function cleanText(value) {
  return String(value ?? '').trim();
}
