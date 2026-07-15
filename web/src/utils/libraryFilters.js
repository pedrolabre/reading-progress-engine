export const LIBRARY_FILTER_GROUP = {
  CATEGORY: 'categories',
  GENRE: 'genres',
  STATUS: 'statuses',
  AUTHOR: 'authors',
  YEAR: 'years',
  TAG: 'tags',
};

export const LIBRARY_FILTER_GROUPS = [
  { id: LIBRARY_FILTER_GROUP.CATEGORY, label: 'Categoria' },
  { id: LIBRARY_FILTER_GROUP.GENRE, label: 'Genero' },
  { id: LIBRARY_FILTER_GROUP.STATUS, label: 'Status' },
  { id: LIBRARY_FILTER_GROUP.AUTHOR, label: 'Autor' },
  { id: LIBRARY_FILTER_GROUP.YEAR, label: 'Ano' },
  { id: LIBRARY_FILTER_GROUP.TAG, label: 'Tags' },
];

const LIBRARY_FILTER_GROUP_IDS = LIBRARY_FILTER_GROUPS.map((group) => group.id);

const STATUS_LABELS = {
  'to-read': 'Quero ler',
  reading: 'Em leitura',
  paused: 'Pausado',
  completed: 'Concluido',
  dropped: 'Abandonado',
};

const STATUS_ORDER = ['reading', 'paused', 'to-read', 'completed', 'dropped'];
const STATUS_RANK = new Map(STATUS_ORDER.map((status, index) => [status, index]));

export function createEmptyLibraryFilters() {
  return Object.fromEntries(LIBRARY_FILTER_GROUP_IDS.map((groupId) => [groupId, []]));
}

export function normalizeLibraryFilters(filters = {}) {
  const normalized = createEmptyLibraryFilters();

  for (const groupId of LIBRARY_FILTER_GROUP_IDS) {
    const values = Array.isArray(filters[groupId]) ? filters[groupId] : [];
    normalized[groupId] = [...new Set(values.map(normalizeFilterValue).filter(Boolean))].sort(
      compareText
    );
  }

  return normalized;
}

export function toggleLibraryFilterValue(filters, groupId, value) {
  const normalized = normalizeLibraryFilters(filters);

  if (!LIBRARY_FILTER_GROUP_IDS.includes(groupId)) {
    return normalized;
  }

  const valueText = normalizeFilterValue(value);

  if (!valueText) {
    return normalized;
  }

  const selectedValues = new Set(normalized[groupId]);

  if (selectedValues.has(valueText)) {
    selectedValues.delete(valueText);
  } else {
    selectedValues.add(valueText);
  }

  return {
    ...normalized,
    [groupId]: [...selectedValues].sort(compareText),
  };
}

export function countActiveLibraryFilters(filters = {}) {
  const normalized = normalizeLibraryFilters(filters);

  return LIBRARY_FILTER_GROUP_IDS.reduce(
    (total, groupId) => total + normalized[groupId].length,
    0
  );
}

export function hasActiveLibraryFilters(filters = {}) {
  return countActiveLibraryFilters(filters) > 0;
}

export function createLibraryFilterOptions(books = []) {
  const optionMaps = new Map(LIBRARY_FILTER_GROUP_IDS.map((groupId) => [groupId, new Map()]));

  for (const book of books) {
    for (const groupId of LIBRARY_FILTER_GROUP_IDS) {
      const entries = createUniqueEntries(getBookFilterEntries(book, groupId));

      for (const entry of entries) {
        addFilterOption(optionMaps.get(groupId), entry);
      }
    }
  }

  return LIBRARY_FILTER_GROUPS.map((group) => ({
    ...group,
    options: sortFilterOptions([...optionMaps.get(group.id).values()], group.id),
  }));
}

export function filterLibraryBooks(books = [], filters = {}) {
  const normalized = normalizeLibraryFilters(filters);

  if (!hasActiveLibraryFilters(normalized)) {
    return [...books];
  }

  return books.filter((book) =>
    LIBRARY_FILTER_GROUP_IDS.every((groupId) => matchesFilterGroup(book, groupId, normalized))
  );
}

function matchesFilterGroup(book, groupId, filters) {
  const selectedValues = filters[groupId] || [];

  if (selectedValues.length === 0) {
    return true;
  }

  const bookValues = new Set(getBookFilterEntries(book, groupId).map((entry) => entry.value));

  return selectedValues.some((value) => bookValues.has(value));
}

function getBookFilterEntries(book, groupId) {
  const bookData = book?.data || {};
  const metrics = book?.metrics || {};

  if (groupId === LIBRARY_FILTER_GROUP.CATEGORY) {
    return compactEntries([
      createFilterEntry(metrics.category || bookData.category, getCategoryLabel(book)),
    ]);
  }

  if (groupId === LIBRARY_FILTER_GROUP.GENRE) {
    return createSlugEntries(bookData.genres);
  }

  if (groupId === LIBRARY_FILTER_GROUP.STATUS) {
    const status = metrics.status || bookData.status;
    return compactEntries([createFilterEntry(status, STATUS_LABELS[status] || status)]);
  }

  if (groupId === LIBRARY_FILTER_GROUP.AUTHOR) {
    return compactEntries([createFilterEntry(metrics.author || bookData.author)]);
  }

  if (groupId === LIBRARY_FILTER_GROUP.YEAR) {
    return compactEntries([createFilterEntry(bookData.year, formatYearLabel(bookData.year))]);
  }

  if (groupId === LIBRARY_FILTER_GROUP.TAG) {
    return createSlugEntries(bookData.tags);
  }

  return [];
}

function addFilterOption(optionMap, entry) {
  const existingOption = optionMap.get(entry.value);

  if (existingOption) {
    existingOption.count += 1;
    return;
  }

  optionMap.set(entry.value, {
    ...entry,
    count: 1,
  });
}

function createUniqueEntries(entries) {
  const unique = new Map();

  for (const entry of entries) {
    if (!unique.has(entry.value)) {
      unique.set(entry.value, entry);
    }
  }

  return [...unique.values()];
}

function createSlugEntries(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return compactEntries(values.map((value) => createFilterEntry(value, formatSlugLabel(value))));
}

function createFilterEntry(value, label = value) {
  const normalizedValue = normalizeFilterValue(value);

  if (!normalizedValue) {
    return null;
  }

  return {
    value: normalizedValue,
    label: normalizeFilterValue(label) || normalizedValue,
  };
}

function compactEntries(entries) {
  return entries.filter(Boolean);
}

function getCategoryLabel(book) {
  const categoryName = book?.category?.data?.name;
  const categorySlug = book?.metrics?.category || book?.data?.category;

  return categoryName || formatSlugLabel(categorySlug);
}

function formatSlugLabel(value) {
  const valueText = normalizeFilterValue(value);

  if (!valueText) {
    return '';
  }

  return valueText.replaceAll('-', ' ');
}

function formatYearLabel(value) {
  return Number.isFinite(value) ? String(value) : '';
}

function normalizeFilterValue(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
}

function sortFilterOptions(options, groupId) {
  return [...options].sort((left, right) => {
    if (groupId === LIBRARY_FILTER_GROUP.STATUS) {
      return getStatusRank(left.value) - getStatusRank(right.value) || compareText(left.label, right.label);
    }

    if (groupId === LIBRARY_FILTER_GROUP.YEAR) {
      return Number(left.value) - Number(right.value);
    }

    return compareText(left.label, right.label) || compareText(left.value, right.value);
  });
}

function getStatusRank(status) {
  return STATUS_RANK.has(status) ? STATUS_RANK.get(status) : STATUS_ORDER.length;
}

function compareText(left, right) {
  const leftText = String(left).toLocaleLowerCase('pt-BR');
  const rightText = String(right).toLocaleLowerCase('pt-BR');

  if (leftText < rightText) {
    return -1;
  }

  if (leftText > rightText) {
    return 1;
  }

  return 0;
}
