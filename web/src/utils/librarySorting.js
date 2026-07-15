export const LIBRARY_SORT = {
  RECENT_ACTIVITY: 'recent-activity',
  OLDEST_ACTIVITY: 'oldest-activity',
  TITLE_ASC: 'title-asc',
  PROGRESS_DESC: 'progress-desc',
  STATUS: 'status',
};

export const DEFAULT_LIBRARY_SORT_ID = LIBRARY_SORT.RECENT_ACTIVITY;

export const LIBRARY_SORT_OPTIONS = [
  {
    id: LIBRARY_SORT.RECENT_ACTIVITY,
    label: 'Atividade recente',
    activeText: 'Ordem ativa: atividade recente',
  },
  {
    id: LIBRARY_SORT.OLDEST_ACTIVITY,
    label: 'Mais antigo',
    activeText: 'Ordem ativa: mais antigo primeiro',
  },
  {
    id: LIBRARY_SORT.TITLE_ASC,
    label: 'Titulo A-Z',
    activeText: 'Ordem ativa: titulo em ordem alfabetica',
  },
  {
    id: LIBRARY_SORT.PROGRESS_DESC,
    label: 'Progresso',
    activeText: 'Ordem ativa: maior progresso primeiro',
  },
  {
    id: LIBRARY_SORT.STATUS,
    label: 'Status',
    activeText: 'Ordem ativa: status',
  },
];

const STATUS_SORT_ORDER = ['reading', 'paused', 'to-read', 'completed', 'dropped'];
const STATUS_SORT_RANK = new Map(STATUS_SORT_ORDER.map((status, index) => [status, index]));

const SORT_COMPARATORS = {
  [LIBRARY_SORT.RECENT_ACTIVITY]: compareByRecentActivity,
  [LIBRARY_SORT.OLDEST_ACTIVITY]: compareByOldestActivity,
  [LIBRARY_SORT.TITLE_ASC]: compareByTitleAndSlug,
  [LIBRARY_SORT.PROGRESS_DESC]: compareByProgress,
  [LIBRARY_SORT.STATUS]: compareByStatus,
};

export function getLibrarySortOption(sortId) {
  return (
    LIBRARY_SORT_OPTIONS.find((option) => option.id === sortId) ||
    LIBRARY_SORT_OPTIONS.find((option) => option.id === DEFAULT_LIBRARY_SORT_ID)
  );
}

export function sortLibraryBooks(books = [], sortId = DEFAULT_LIBRARY_SORT_ID) {
  const sortOption = getLibrarySortOption(sortId);
  const comparator = SORT_COMPARATORS[sortOption.id] || SORT_COMPARATORS[DEFAULT_LIBRARY_SORT_ID];

  return [...books].sort(
    (left, right) => comparator(left, right) || compareByTitleAndSlug(left, right)
  );
}

function compareByRecentActivity(left, right) {
  return compareDatesDescendingMissingLast(
    left?.metrics?.activityDates?.lastActivityDate,
    right?.metrics?.activityDates?.lastActivityDate
  );
}

function compareByOldestActivity(left, right) {
  return compareDatesAscendingMissingLast(
    left?.metrics?.activityDates?.firstActivityDate,
    right?.metrics?.activityDates?.firstActivityDate
  );
}

function compareByProgress(left, right) {
  const leftProgress = toFiniteNumber(left?.metrics?.progress, -Infinity);
  const rightProgress = toFiniteNumber(right?.metrics?.progress, -Infinity);

  return rightProgress - leftProgress;
}

function compareByStatus(left, right) {
  const byStatus = getStatusRank(left?.metrics?.status) - getStatusRank(right?.metrics?.status);

  if (byStatus !== 0) {
    return byStatus;
  }

  return compareText(left?.metrics?.status || '', right?.metrics?.status || '');
}

function compareByTitleAndSlug(left, right) {
  const byTitle = compareText(getBookTitle(left), getBookTitle(right));

  if (byTitle !== 0) {
    return byTitle;
  }

  return compareText(left?.slug || '', right?.slug || '');
}

function compareDatesDescendingMissingLast(leftDate, rightDate) {
  if (leftDate && rightDate) {
    return compareText(rightDate, leftDate);
  }

  if (leftDate) {
    return -1;
  }

  if (rightDate) {
    return 1;
  }

  return 0;
}

function compareDatesAscendingMissingLast(leftDate, rightDate) {
  if (leftDate && rightDate) {
    return compareText(leftDate, rightDate);
  }

  if (leftDate) {
    return -1;
  }

  if (rightDate) {
    return 1;
  }

  return 0;
}

function getBookTitle(book) {
  return book?.metrics?.title || book?.data?.title || '';
}

function getStatusRank(status) {
  return STATUS_SORT_RANK.has(status) ? STATUS_SORT_RANK.get(status) : STATUS_SORT_ORDER.length;
}

function toFiniteNumber(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
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
