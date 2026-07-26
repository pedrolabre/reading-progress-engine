import {
  LIBRARY_FILTER_GROUP,
  LIBRARY_FILTER_GROUPS,
  createEmptyLibraryFilters,
  normalizeLibraryFilters,
} from './libraryFilters.js';
import { DEFAULT_LIBRARY_SORT_ID, getLibrarySortOption } from './librarySorting.js';

export const LIBRARY_URL_PARAM = {
  SORT: 'sort',
  CATEGORY: 'category',
  GENRE: 'genre',
  STATUS: 'status',
  AUTHOR: 'author',
  YEAR: 'year',
  TAG: 'tag',
};

const FILTER_PARAM_BY_GROUP = {
  [LIBRARY_FILTER_GROUP.CATEGORY]: LIBRARY_URL_PARAM.CATEGORY,
  [LIBRARY_FILTER_GROUP.GENRE]: LIBRARY_URL_PARAM.GENRE,
  [LIBRARY_FILTER_GROUP.STATUS]: LIBRARY_URL_PARAM.STATUS,
  [LIBRARY_FILTER_GROUP.AUTHOR]: LIBRARY_URL_PARAM.AUTHOR,
  [LIBRARY_FILTER_GROUP.YEAR]: LIBRARY_URL_PARAM.YEAR,
  [LIBRARY_FILTER_GROUP.TAG]: LIBRARY_URL_PARAM.TAG,
};

export function parseLibraryUrlState(searchParams = new URLSearchParams()) {
  const params = toSearchParams(searchParams);
  const filters = createEmptyLibraryFilters();

  for (const group of LIBRARY_FILTER_GROUPS) {
    const paramName = FILTER_PARAM_BY_GROUP[group.id];
    filters[group.id] = params.getAll(paramName).map(normalizeUrlValue).filter(Boolean);
  }

  return normalizeLibraryUrlState({
    sortId: params.get(LIBRARY_URL_PARAM.SORT),
    filters,
  });
}

export function createLibrarySearchParams(state = {}) {
  const normalizedState = normalizeLibraryUrlState(state);
  const params = new URLSearchParams();

  if (normalizedState.sortId !== DEFAULT_LIBRARY_SORT_ID) {
    params.set(LIBRARY_URL_PARAM.SORT, normalizedState.sortId);
  }

  for (const group of LIBRARY_FILTER_GROUPS) {
    const paramName = FILTER_PARAM_BY_GROUP[group.id];

    for (const value of normalizedState.filters[group.id]) {
      params.append(paramName, value);
    }
  }

  return params;
}

export function normalizeLibraryUrlState(state = {}) {
  return {
    sortId: getLibrarySortOption(state.sortId).id,
    filters: normalizeLibraryFilters(state.filters),
  };
}

export function validateLibraryUrlFilters(filters = {}, filterGroups = []) {
  const normalizedFilters = normalizeLibraryFilters(filters);
  const allowedValuesByGroup = createAllowedFilterValueMap(filterGroups);
  const validatedFilters = createEmptyLibraryFilters();

  for (const group of LIBRARY_FILTER_GROUPS) {
    const allowedValues = allowedValuesByGroup.get(group.id) || new Set();

    validatedFilters[group.id] = normalizedFilters[group.id].filter((value) =>
      allowedValues.has(value)
    );
  }

  return normalizeLibraryFilters(validatedFilters);
}

function createAllowedFilterValueMap(filterGroups) {
  const allowedValuesByGroup = new Map();

  for (const group of filterGroups) {
    if (!group?.id || !Array.isArray(group.options)) {
      continue;
    }

    allowedValuesByGroup.set(
      group.id,
      new Set(group.options.map((option) => normalizeUrlValue(option.value)).filter(Boolean))
    );
  }

  return allowedValuesByGroup;
}

function toSearchParams(searchParams) {
  if (searchParams instanceof URLSearchParams) {
    return searchParams;
  }

  return new URLSearchParams(searchParams);
}

function normalizeUrlValue(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
}
