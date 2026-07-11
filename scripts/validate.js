'use strict';

const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const { slugify } = require('./slugify');

const DEFAULT_ROOT = path.resolve(__dirname, '..');
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const UTC_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;

const SUPPORTED_SCHEMA_KEYS = new Set([
  '$defs',
  '$ref',
  '$schema',
  'additionalProperties',
  'anyOf',
  'default',
  'description',
  'enum',
  'examples',
  'format',
  'items',
  'maximum',
  'minimum',
  'minLength',
  'multipleOf',
  'pattern',
  'properties',
  'required',
  'title',
  'type',
  'uniqueItems',
]);

const SCHEMA_FILES = {
  book: path.join('schemas', 'book.schema.json'),
  strike: path.join('schemas', 'strike.schema.json'),
  category: path.join('schemas', 'category.schema.json'),
  library: path.join('schemas', 'library.schema.json'),
};

const EXAMPLE_FILES = [
  ['book-example.json', 'book'],
  ['strike-example.json', 'strike'],
  ['category-example.json', 'category'],
];

function relativePath(rootDir, filePath) {
  return path.relative(rootDir, filePath).replace(/\\/g, '/');
}

function readJsonFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');

  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid JSON in ${filePath}: ${error.message}`);
  }
}

function listJsonFiles(directory, recursive = false) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  const entries = fs
    .readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name));

  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory() && recursive) {
      files.push(...listJsonFiles(entryPath, true));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      files.push(entryPath);
    }
  }

  return files;
}

function ensureDirectory(rootDir, relativeDirectory, errors) {
  const directory = path.join(rootDir, relativeDirectory);

  if (!fs.existsSync(directory)) {
    errors.push(`${relativeDirectory.replace(/\\/g, '/')} does not exist`);
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validateJsonSchema(value, schema, label) {
  const errors = [];
  validateNode(value, schema, schema, label, errors);
  return errors;
}

function validateNode(value, schema, rootSchema, location, errors) {
  if (!isPlainObject(schema)) {
    errors.push(`${location}: schema node must be an object`);
    return;
  }

  if (schema.$ref) {
    validateNode(value, resolveRef(schema.$ref, rootSchema), rootSchema, location, errors);
    return;
  }

  if (Array.isArray(schema.anyOf)) {
    const matched = schema.anyOf.some((candidate) => {
      const candidateErrors = [];
      validateNode(value, candidate, rootSchema, location, candidateErrors);
      return candidateErrors.length === 0;
    });

    if (!matched) {
      errors.push(`${location}: must match one allowed schema`);
    }

    return;
  }

  if (schema.type !== undefined && !matchesType(value, schema.type)) {
    errors.push(`${location}: expected ${formatType(schema.type)}, got ${describeValue(value)}`);
    return;
  }

  if (schema.enum && !schema.enum.includes(value)) {
    errors.push(`${location}: expected one of ${schema.enum.join(', ')}`);
  }

  if (typeof value === 'string') {
    validateString(value, schema, location, errors);
  }

  if (typeof value === 'number') {
    validateNumber(value, schema, location, errors);
  }

  if (Array.isArray(value)) {
    validateArray(value, schema, rootSchema, location, errors);
  }

  if (isPlainObject(value)) {
    validateObject(value, schema, rootSchema, location, errors);
  }
}

function resolveRef(ref, rootSchema) {
  if (!ref.startsWith('#/')) {
    throw new Error(`Only local JSON Schema refs are supported: ${ref}`);
  }

  return ref
    .slice(2)
    .split('/')
    .map((part) => part.replace(/~1/g, '/').replace(/~0/g, '~'))
    .reduce((current, part) => current[part], rootSchema);
}

function matchesType(value, expectedType) {
  if (Array.isArray(expectedType)) {
    return expectedType.some((type) => matchesType(value, type));
  }

  if (expectedType === 'integer') {
    return Number.isInteger(value);
  }

  if (expectedType === 'number') {
    return typeof value === 'number' && Number.isFinite(value);
  }

  if (expectedType === 'object') {
    return isPlainObject(value);
  }

  if (expectedType === 'array') {
    return Array.isArray(value);
  }

  if (expectedType === 'null') {
    return value === null;
  }

  return typeof value === expectedType;
}

function formatType(expectedType) {
  return Array.isArray(expectedType) ? expectedType.join(' or ') : expectedType;
}

function describeValue(value) {
  if (value === null) {
    return 'null';
  }

  if (Array.isArray(value)) {
    return 'array';
  }

  return typeof value;
}

function validateString(value, schema, location, errors) {
  if (schema.minLength !== undefined && value.length < schema.minLength) {
    errors.push(`${location}: must have at least ${schema.minLength} character(s)`);
  }

  if (schema.pattern !== undefined && !new RegExp(schema.pattern).test(value)) {
    errors.push(`${location}: must match pattern ${schema.pattern}`);
  }

  if (schema.format === 'date' && !isValidDate(value)) {
    errors.push(`${location}: must be a valid YYYY-MM-DD date`);
  }

  if (schema.format === 'date-time' && !isValidUtcTimestamp(value)) {
    errors.push(`${location}: must be a valid UTC timestamp without milliseconds`);
  }

  if (schema.format === 'uri' && !isValidUri(value)) {
    errors.push(`${location}: must be a valid URI`);
  }
}

function validateNumber(value, schema, location, errors) {
  if (schema.minimum !== undefined && value < schema.minimum) {
    errors.push(`${location}: must be >= ${schema.minimum}`);
  }

  if (schema.maximum !== undefined && value > schema.maximum) {
    errors.push(`${location}: must be <= ${schema.maximum}`);
  }

  if (schema.multipleOf !== undefined && !isMultipleOf(value, schema.multipleOf)) {
    errors.push(`${location}: must be a multiple of ${schema.multipleOf}`);
  }
}

function validateArray(value, schema, rootSchema, location, errors) {
  if (schema.uniqueItems) {
    const seen = new Set();

    for (const item of value) {
      const key = JSON.stringify(item);

      if (seen.has(key)) {
        errors.push(`${location}: must not contain duplicate items`);
        break;
      }

      seen.add(key);
    }
  }

  if (schema.items) {
    value.forEach((item, index) => {
      validateNode(item, schema.items, rootSchema, `${location}[${index}]`, errors);
    });
  }
}

function validateObject(value, schema, rootSchema, location, errors) {
  const properties = schema.properties || {};

  if (Array.isArray(schema.required)) {
    for (const key of schema.required) {
      if (!Object.prototype.hasOwnProperty.call(value, key)) {
        errors.push(`${location}.${key}: is required`);
      }
    }
  }

  if (schema.additionalProperties === false) {
    for (const key of Object.keys(value)) {
      if (!Object.prototype.hasOwnProperty.call(properties, key)) {
        errors.push(`${location}.${key}: is not allowed`);
      }
    }
  }

  for (const [key, propertySchema] of Object.entries(properties)) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      validateNode(value[key], propertySchema, rootSchema, `${location}.${key}`, errors);
    }
  }
}

function isValidDate(value) {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(`${value}T00:00:00Z`);

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day
  );
}

function isValidUtcTimestamp(value) {
  if (!UTC_TIMESTAMP_PATTERN.test(value)) {
    return false;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return date.toISOString().replace('.000Z', 'Z') === value;
}

function isValidUri(value) {
  try {
    new URL(value);
    return true;
  } catch (_error) {
    return false;
  }
}

function isMultipleOf(value, divisor) {
  const quotient = value / divisor;
  return Math.abs(quotient - Math.round(quotient)) < 1e-9;
}

function validateSupportedSchemaKeywords(schema, label, errors) {
  scanSchemaKeywords(schema, label, errors);
}

function scanSchemaKeywords(schema, location, errors) {
  if (!isPlainObject(schema)) {
    return;
  }

  for (const [key, value] of Object.entries(schema)) {
    if (!SUPPORTED_SCHEMA_KEYS.has(key)) {
      errors.push(`${location}: unsupported JSON Schema keyword "${key}"`);
      continue;
    }

    if (key === '$defs' || key === 'properties') {
      for (const [childKey, childSchema] of Object.entries(value)) {
        scanSchemaKeywords(childSchema, `${location}.${key}.${childKey}`, errors);
      }
    } else if (key === 'items') {
      scanSchemaKeywords(value, `${location}.items`, errors);
    } else if (key === 'anyOf' && Array.isArray(value)) {
      value.forEach((childSchema, index) => {
        scanSchemaKeywords(childSchema, `${location}.anyOf[${index}]`, errors);
      });
    }
  }
}

function validateProject(rootDir = DEFAULT_ROOT, options = {}) {
  const includeLibrary = options.includeLibrary !== false;
  const errors = [];

  ensureDirectory(rootDir, path.join('schemas'), errors);
  ensureDirectory(rootDir, path.join('examples'), errors);
  ensureDirectory(rootDir, path.join('data', 'books'), errors);
  ensureDirectory(rootDir, path.join('data', 'categories'), errors);
  ensureDirectory(rootDir, path.join('data', 'strikes'), errors);

  const schemas = loadSchemas(rootDir, errors);
  const data = {
    books: new Map(),
    categories: new Map(),
    strikesByBook: new Map(),
    examples: [],
    library: null,
  };

  if (Object.keys(schemas).length === Object.keys(SCHEMA_FILES).length) {
    validateExamples(rootDir, schemas, data, errors);
    validateDataFiles(rootDir, schemas, data, errors);

    if (includeLibrary) {
      validateLibraryIfPresent(rootDir, schemas, data, errors);
    }

    validateCrossReferences(data, errors);
  }

  return {
    ok: errors.length === 0,
    errors,
    schemas,
    data,
    summary: {
      schemas: Object.keys(schemas).length,
      examples: data.examples.length,
      books: data.books.size,
      categories: data.categories.size,
      strikes: Array.from(data.strikesByBook.values()).reduce(
        (total, strikes) => total + strikes.length,
        0
      ),
      libraryPresent: data.library !== null,
    },
  };
}

function loadSchemas(rootDir, errors) {
  const schemas = {};

  for (const [name, relativeFile] of Object.entries(SCHEMA_FILES)) {
    const filePath = path.join(rootDir, relativeFile);

    try {
      schemas[name] = readJsonFile(filePath);
      validateSupportedSchemaKeywords(schemas[name], relativeFile.replace(/\\/g, '/'), errors);
    } catch (error) {
      errors.push(error.message);
    }
  }

  return schemas;
}

function validateExamples(rootDir, schemas, data, errors) {
  for (const [fileName, schemaName] of EXAMPLE_FILES) {
    const filePath = path.join(rootDir, 'examples', fileName);
    const label = relativePath(rootDir, filePath);

    try {
      const json = readJsonFile(filePath);
      addSchemaErrors(label, validateJsonSchema(json, schemas[schemaName], label), errors);
      data.examples.push({ filePath, schemaName, data: json });
    } catch (error) {
      errors.push(error.message);
    }
  }
}

function validateDataFiles(rootDir, schemas, data, errors) {
  const bookFiles = listJsonFiles(path.join(rootDir, 'data', 'books'));
  const categoryFiles = listJsonFiles(path.join(rootDir, 'data', 'categories'));
  const strikeFiles = listJsonFiles(path.join(rootDir, 'data', 'strikes'), true);

  for (const filePath of bookFiles) {
    const label = relativePath(rootDir, filePath);
    const slug = path.basename(filePath, '.json');

    try {
      const json = readJsonFile(filePath);
      addSchemaErrors(label, validateJsonSchema(json, schemas.book, label), errors);
      data.books.set(slug, { slug, filePath, data: json });
    } catch (error) {
      errors.push(error.message);
    }
  }

  for (const filePath of categoryFiles) {
    const label = relativePath(rootDir, filePath);
    const slug = path.basename(filePath, '.json');

    try {
      const json = readJsonFile(filePath);
      addSchemaErrors(label, validateJsonSchema(json, schemas.category, label), errors);
      data.categories.set(slug, { slug, filePath, data: json });
    } catch (error) {
      errors.push(error.message);
    }
  }

  for (const filePath of strikeFiles) {
    const label = relativePath(rootDir, filePath);
    const parentSlug = path.basename(path.dirname(filePath));

    try {
      const json = readJsonFile(filePath);
      addSchemaErrors(label, validateJsonSchema(json, schemas.strike, label), errors);

      if (!data.strikesByBook.has(parentSlug)) {
        data.strikesByBook.set(parentSlug, []);
      }

      data.strikesByBook.get(parentSlug).push({
        parentSlug,
        filePath,
        data: json,
      });
    } catch (error) {
      errors.push(error.message);
    }
  }
}

function validateLibraryIfPresent(rootDir, schemas, data, errors) {
  const filePath = path.join(rootDir, 'data', 'library.json');

  if (!fs.existsSync(filePath)) {
    return;
  }

  const label = relativePath(rootDir, filePath);

  try {
    const json = readJsonFile(filePath);
    addSchemaErrors(label, validateJsonSchema(json, schemas.library, label), errors);
    data.library = { filePath, data: json };
  } catch (error) {
    errors.push(error.message);
  }
}

function addSchemaErrors(label, schemaErrors, errors) {
  for (const error of schemaErrors) {
    errors.push(`${label}: ${error}`);
  }
}

function validateCrossReferences(data, errors) {
  validateCategoryPaths(data, errors);
  validateBookPathsAndProgress(data, errors);
  validateStrikePathsAndPages(data, errors);
  validatePageIntervalOverlaps(data, errors);
}

function validateCategoryPaths(data, errors) {
  for (const category of data.categories.values()) {
    const label = relativePath(DEFAULT_ROOT, category.filePath);

    if (category.slug !== category.data.slug) {
      errors.push(`${label}: file slug "${category.slug}" must match category.slug "${category.data.slug}"`);
    }
  }
}

function validateBookPathsAndProgress(data, errors) {
  for (const book of data.books.values()) {
    const label = relativePath(DEFAULT_ROOT, book.filePath);
    const expectedSlug = trySlugify(book.data.title, label, errors);

    if (!SLUG_PATTERN.test(book.slug)) {
      errors.push(`${label}: file name must be a kebab-case slug`);
    }

    if (expectedSlug && book.slug !== expectedSlug) {
      errors.push(`${label}: file slug "${book.slug}" must match slugify(title) "${expectedSlug}"`);
    }

    if (!data.categories.has(book.data.category)) {
      errors.push(`${label}: category "${book.data.category}" does not exist in data/categories`);
    }

    if (book.data.currentPage > book.data.totalPages) {
      errors.push(`${label}: currentPage must be <= totalPages`);
    }

    if (book.data.status === 'completed' && book.data.currentPage !== book.data.totalPages) {
      errors.push(`${label}: completed books must have currentPage equal to totalPages`);
    }
  }
}

function validateStrikePathsAndPages(data, errors) {
  for (const [parentSlug, strikes] of data.strikesByBook.entries()) {
    const book = data.books.get(parentSlug);

    if (!book) {
      for (const strike of strikes) {
        errors.push(`${relativePath(DEFAULT_ROOT, strike.filePath)}: parent book "${parentSlug}" does not exist in data/books`);
      }

      continue;
    }

    for (const strike of strikes) {
      const label = relativePath(DEFAULT_ROOT, strike.filePath);
      const fileStem = path.basename(strike.filePath, '.json');

      if (strike.data.book !== parentSlug) {
        errors.push(`${label}: strike.book "${strike.data.book}" must match parent folder "${parentSlug}"`);
      }

      if (!isStrikeFileDateCoherent(fileStem, strike.data.date)) {
        errors.push(`${label}: file name must match strike.date or use a numeric same-day suffix`);
      }

      if (strike.data.endPage <= strike.data.startPage) {
        errors.push(`${label}: endPage must be greater than startPage`);
      }

      if (strike.data.pagesRead !== strike.data.endPage - strike.data.startPage) {
        errors.push(`${label}: pagesRead must equal endPage - startPage`);
      }

      if (strike.data.endPage > book.data.totalPages) {
        errors.push(`${label}: endPage must be <= totalPages for ${parentSlug}`);
      }
    }
  }
}

function validatePageIntervalOverlaps(data, errors) {
  for (const [bookSlug, strikes] of data.strikesByBook.entries()) {
    const sorted = [...strikes].sort((left, right) => {
      const byStart = left.data.startPage - right.data.startPage;

      if (byStart !== 0) {
        return byStart;
      }

      return left.data.endPage - right.data.endPage;
    });

    for (let index = 1; index < sorted.length; index += 1) {
      const previous = sorted[index - 1];
      const current = sorted[index];

      if (current.data.startPage < previous.data.endPage) {
        errors.push(
          `${relativePath(DEFAULT_ROOT, current.filePath)}: page interval overlaps with ${relativePath(
            DEFAULT_ROOT,
            previous.filePath
          )} for ${bookSlug}`
        );
      }
    }
  }
}

function trySlugify(value, label, errors) {
  try {
    return slugify(value);
  } catch (error) {
    errors.push(`${label}: ${error.message}`);
    return null;
  }
}

function isStrikeFileDateCoherent(fileStem, date) {
  if (fileStem === date) {
    return true;
  }

  if (!fileStem.startsWith(`${date}-`)) {
    return false;
  }

  return /^[1-9]\d*$/.test(fileStem.slice(date.length + 1));
}

function printReport(report) {
  if (report.ok) {
    console.log('Validation OK');
    console.log(`Schemas: ${report.summary.schemas}`);
    console.log(`Examples: ${report.summary.examples}`);
    console.log(`Books: ${report.summary.books}`);
    console.log(`Categories: ${report.summary.categories}`);
    console.log(`Strikes: ${report.summary.strikes}`);
    console.log(`Library present: ${report.summary.libraryPresent ? 'yes' : 'no'}`);
    return;
  }

  console.error(`Validation failed with ${report.errors.length} error(s):`);

  for (const error of report.errors) {
    console.error(`- ${error}`);
  }
}

if (require.main === module) {
  const report = validateProject(DEFAULT_ROOT);
  printReport(report);

  if (!report.ok) {
    process.exit(1);
  }
}

module.exports = {
  DEFAULT_ROOT,
  readJsonFile,
  relativePath,
  validateJsonSchema,
  validateProject,
};
