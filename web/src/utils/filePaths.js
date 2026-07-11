import { slugify } from './slugify.js';

export function getBookFileInfo(titleOrSlug) {
  const slug = slugify(titleOrSlug);
  const fileName = `${slug}.json`;

  return {
    slug,
    fileName,
    path: `data/books/${fileName}`,
  };
}

export function getStrikeFileInfo(bookSlugOrTitle, date, sequence = 1) {
  const bookSlug = slugify(bookSlugOrTitle);
  const safeDate = requireText(date, 'date');
  const suffix = Number.isInteger(sequence) && sequence > 1 ? `-${sequence}` : '';
  const fileName = `${safeDate}${suffix}.json`;

  return {
    slug: bookSlug,
    fileName,
    path: `data/strikes/${bookSlug}/${fileName}`,
  };
}

export function getCategoryFileInfo(nameOrSlug) {
  const slug = slugify(nameOrSlug);
  const fileName = `${slug}.json`;

  return {
    slug,
    fileName,
    path: `data/categories/${fileName}`,
  };
}

function requireText(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${label} is required to create file info`);
  }

  return value.trim();
}
