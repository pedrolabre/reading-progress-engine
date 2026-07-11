'use strict';

function slugify(value) {
  if (typeof value !== 'string') {
    throw new TypeError('slugify expects a string value');
  }

  const slug = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

  if (!slug) {
    throw new Error(`Could not create a slug from "${value}"`);
  }

  return slug;
}

if (require.main === module) {
  const input = process.argv.slice(2).join(' ');

  if (!input) {
    console.error('Usage: node scripts/slugify.js <text>');
    process.exit(1);
  }

  console.log(slugify(input));
}

module.exports = {
  slugify,
};
