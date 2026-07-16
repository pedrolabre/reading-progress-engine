const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const BOOK_PATH_PATTERN = /^data\/books\/([^/]+)\.json$/;
const CATEGORY_PATH_PATTERN = /^data\/categories\/([^/]+)\.json$/;
const STRIKE_PATH_PATTERN = /^data\/strikes\/([^/]+)\/([^/]+)\.json$/;

export class LibraryDiscoveryPathError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'LibraryDiscoveryPathError';
    this.details = details;
  }
}

export function normalizeModulePath(modulePath) {
  if (typeof modulePath !== 'string') {
    throw new TypeError('module path must be a string');
  }

  const normalized = modulePath.trim().replace(/\\/g, '/').replace(/[?#].*$/, '');

  if (!normalized) {
    throw new LibraryDiscoveryPathError('module path must not be empty');
  }

  const compactPath = normalized.replace(/\/+/g, '/');
  const dataSegmentIndex = getDataSegmentIndex(compactPath);

  if (dataSegmentIndex >= 0) {
    return compactPath.slice(dataSegmentIndex);
  }

  return compactPath.replace(/^(?:\.\/)+/, '');
}

export function parseBookModulePath(modulePath) {
  return parseEntityModulePath({
    modulePath,
    kind: 'book',
    pattern: BOOK_PATH_PATTERN,
    expected: 'data/books/{slug}.json',
  });
}

export function parseCategoryModulePath(modulePath) {
  return parseEntityModulePath({
    modulePath,
    kind: 'category',
    pattern: CATEGORY_PATH_PATTERN,
    expected: 'data/categories/{slug}.json',
  });
}

export function parseStrikeModulePath(modulePath) {
  const path = normalizeModulePath(modulePath);
  const match = STRIKE_PATH_PATTERN.exec(path);

  if (!match) {
    throw createPathError('strike', modulePath, 'data/strikes/{bookSlug}/{fileName}.json', path);
  }

  const [, bookSlug, fileStem] = match;
  assertSlug(bookSlug, 'strike book slug', path);
  assertSlug(fileStem, 'strike file stem', path);

  return {
    kind: 'strike',
    bookSlug,
    fileName: `${fileStem}.json`,
    fileStem,
    path,
  };
}

export function createBookSourceEntry(modulePath, moduleValue) {
  const parsedPath = parseBookModulePath(modulePath);

  return {
    slug: parsedPath.slug,
    path: parsedPath.path,
    data: getModuleData(moduleValue),
  };
}

export function createCategorySourceEntry(modulePath, moduleValue) {
  const parsedPath = parseCategoryModulePath(modulePath);

  return {
    slug: parsedPath.slug,
    path: parsedPath.path,
    data: getModuleData(moduleValue),
  };
}

export function createStrikeSourceEntry(modulePath, moduleValue) {
  const parsedPath = parseStrikeModulePath(modulePath);

  return {
    bookSlug: parsedPath.bookSlug,
    fileName: parsedPath.fileName,
    fileStem: parsedPath.fileStem,
    path: parsedPath.path,
    data: getModuleData(moduleValue),
  };
}

export function createLibrarySourceEntry(modulePath, moduleValue) {
  const path = normalizeModulePath(modulePath);

  if (path !== 'data/library.json') {
    throw createPathError('library', modulePath, 'data/library.json', path);
  }

  return {
    path,
    data: getModuleData(moduleValue),
  };
}

export function createBookSourceEntriesFromModules(modules) {
  return createSourceEntriesFromModules(modules, 'book modules', createBookSourceEntry).sort(
    compareEntitySourceEntries
  );
}

export function createCategorySourceEntriesFromModules(modules) {
  return createSourceEntriesFromModules(
    modules,
    'category modules',
    createCategorySourceEntry
  ).sort(compareEntitySourceEntries);
}

export function createStrikeSourceEntriesFromModules(modules) {
  return createSourceEntriesFromModules(modules, 'strike modules', createStrikeSourceEntry).sort(
    compareStrikeSourceEntries
  );
}

export function createLibrarySourceFromModuleMaps({
  strategy = 'vite-module-map',
  books = {},
  categories = {},
  strikes = {},
  library = null,
} = {}) {
  const source = {
    strategy,
    books: createBookSourceEntriesFromModules(books),
    categories: createCategorySourceEntriesFromModules(categories),
    strikes: createStrikeSourceEntriesFromModules(strikes),
  };

  if (library) {
    source.library = createLibrarySourceEntry(library.path, library.data);
  }

  return source;
}

export function isValidLibrarySlug(value) {
  return typeof value === 'string' && SLUG_PATTERN.test(value);
}

function parseEntityModulePath({ modulePath, kind, pattern, expected }) {
  const path = normalizeModulePath(modulePath);
  const match = pattern.exec(path);

  if (!match) {
    throw createPathError(kind, modulePath, expected, path);
  }

  const slug = match[1];
  assertSlug(slug, `${kind} slug`, path);

  return {
    kind,
    slug,
    fileName: `${slug}.json`,
    fileStem: slug,
    path,
  };
}

function createSourceEntriesFromModules(modules, label, createEntry) {
  if (!isPlainObject(modules)) {
    throw new TypeError(`${label} must be a Vite module map object`);
  }

  return Object.entries(modules).map(([modulePath, moduleValue]) =>
    createEntry(modulePath, moduleValue)
  );
}

function getModuleData(moduleValue) {
  if (isPlainObject(moduleValue) && hasOwn(moduleValue, 'default')) {
    return moduleValue.default;
  }

  return moduleValue;
}

function getDataSegmentIndex(path) {
  if (path.startsWith('data/')) {
    return 0;
  }

  const nestedIndex = path.indexOf('/data/');

  return nestedIndex >= 0 ? nestedIndex + 1 : -1;
}

function assertSlug(value, label, path) {
  if (!isValidLibrarySlug(value)) {
    throw new LibraryDiscoveryPathError(`${path}: ${label} "${value}" must be kebab-case`, {
      path,
      label,
      value,
    });
  }
}

function createPathError(kind, modulePath, expected, normalizedPath = null) {
  return new LibraryDiscoveryPathError(
    `${modulePath}: expected ${kind} module path to match ${expected}`,
    {
      kind,
      modulePath,
      normalizedPath,
      expected,
    }
  );
}

function compareEntitySourceEntries(left, right) {
  const bySlug = compareText(left.slug, right.slug);

  if (bySlug !== 0) {
    return bySlug;
  }

  return compareText(left.path, right.path);
}

function compareStrikeSourceEntries(left, right) {
  const byBook = compareText(left.bookSlug, right.bookSlug);

  if (byBook !== 0) {
    return byBook;
  }

  const byFile = compareText(left.fileStem, right.fileStem);

  if (byFile !== 0) {
    return byFile;
  }

  return compareText(left.path, right.path);
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
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
