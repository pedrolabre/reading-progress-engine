const STATUS_LABELS = {
  'to-read': 'Quero ler',
  reading: 'Em leitura',
  paused: 'Pausado',
  completed: 'Concluido',
  dropped: 'Abandonado',
};

const numberFormatter = new Intl.NumberFormat('pt-BR');
const percentageFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 2,
});
const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

export function createBookDetail(libraryMetrics, slug) {
  const normalizedSlug = normalizeSlug(slug);
  const book = libraryMetrics?.booksBySlug?.get(normalizedSlug);

  if (!book) {
    return {
      found: false,
      slug: normalizedSlug,
      availableBooks: createAvailableBooks(libraryMetrics?.books),
    };
  }

  const data = book.data || {};
  const metrics = book.metrics || {};
  const title = metrics.title || data.title || 'Livro sem titulo';
  const author = metrics.author || data.author || 'Autor nao informado';
  const category = createCategoryDetail(book, metrics);
  const status = createStatusDetail(metrics.status || data.status);
  const progress = createProgressDetail(metrics);
  const activity = createActivityDetail(metrics.activityDates || {});
  const timeline = createTimelineEntries(book.strikes, metrics.totalPages);

  return {
    found: true,
    slug: book.slug,
    path: book.path,
    title,
    author,
    status,
    category,
    progress,
    activity,
    metrics: createMetricCards(metrics, activity),
    metadata: createMetadataItems(book, status, category, activity),
    genres: createChipItems(data.genres),
    tags: createChipItems(data.tags),
    notes: normalizeOptionalText(data.notes),
    timeline,
  };
}

export function createTimelineEntries(strikes = [], totalPages = 0) {
  return sortStrikeRecords(strikes).map((strike, index) => {
    const data = strike?.data || {};
    const endPage = toFiniteNumber(data.endPage, 0);
    const progressValue = calculateProgress(endPage, totalPages);

    return {
      id: strike?.id || strike?.path || `${data.date || 'strike'}-${index}`,
      path: strike?.path || '',
      date: data.date || '',
      dateLabel: formatDate(data.date),
      pageRangeLabel: formatPageRange(data.startPage, data.endPage),
      pagesReadLabel: `${formatNumber(data.pagesRead)} paginas`,
      chapter: normalizeOptionalText(data.chapter),
      durationLabel: formatDuration(data.duration),
      mood: normalizeOptionalText(data.mood),
      notes: normalizeOptionalText(data.notes),
      progressLabel: `${formatPercentage(progressValue)} do livro`,
      progressValue,
    };
  });
}

function createStatusDetail(status) {
  const value = normalizeOptionalText(status) || 'to-read';

  return {
    value,
    label: STATUS_LABELS[value] || value,
  };
}

function createCategoryDetail(book, metrics) {
  const categoryData = book?.category?.data || {};
  const slug = metrics.category || book?.data?.category || categoryData.slug || '';

  return {
    slug,
    name:
      categoryData.name ||
      (slug ? `Categoria nao carregada: ${formatSlugLabel(slug)}` : 'Categoria nao informada'),
    description: normalizeOptionalText(categoryData.description),
    color: categoryData.color || 'var(--color-accent-strong)',
    isMissing: Boolean(slug && !book?.category),
  };
}

function createProgressDetail(metrics) {
  const currentPage = toFiniteNumber(metrics.currentPage, 0);
  const totalPages = toFiniteNumber(metrics.totalPages, 0);
  const progress = toFiniteNumber(metrics.progress, 0);

  return {
    value: progress,
    label: formatPercentage(progress),
    currentPage,
    totalPages,
    currentPageLabel: formatNumber(currentPage),
    totalPagesLabel: formatNumber(totalPages),
    pageSummary: `${formatNumber(currentPage)} de ${formatNumber(totalPages)} paginas`,
  };
}

function createActivityDetail(activityDates) {
  return {
    startDate: activityDates.startDate || null,
    endDate: activityDates.endDate || null,
    firstStrike: activityDates.firstStrike || null,
    lastStrike: activityDates.lastStrike || null,
    firstActivityDate: activityDates.firstActivityDate || null,
    lastActivityDate: activityDates.lastActivityDate || null,
    startDateLabel: formatDate(activityDates.startDate),
    endDateLabel: formatDate(activityDates.endDate),
    firstStrikeLabel: formatDate(activityDates.firstStrike),
    lastStrikeLabel: formatDate(activityDates.lastStrike),
    firstActivityLabel: formatDate(activityDates.firstActivityDate),
    lastActivityLabel: formatDate(activityDates.lastActivityDate),
  };
}

function createMetricCards(metrics, activity) {
  return [
    {
      label: 'Progresso',
      value: formatPercentage(metrics.progress),
      detail: `${formatNumber(metrics.currentPage)} paginas atuais`,
    },
    {
      label: 'Paginas lidas',
      value: formatNumber(metrics.totalPagesRead),
      detail: `${formatNumber(metrics.totalPages)} paginas no livro`,
    },
    {
      label: 'Strikes',
      value: formatNumber(metrics.totalStrikes),
      detail: `${formatNumber(metrics.averagePagesPerStrike)} paginas por strike`,
    },
    {
      label: 'Primeira atividade',
      value: activity.firstActivityLabel,
      detail: 'Inicio registrado',
    },
    {
      label: 'Ultima atividade',
      value: activity.lastActivityLabel,
      detail: 'Atividade mais recente',
    },
  ];
}

function createMetadataItems(book, status, category, activity) {
  const data = book?.data || {};

  return compactItems([
    createMetadataItem('Status', status.label),
    createMetadataItem('Categoria', category.name),
    createMetadataItem('Slug', book?.slug, 'code'),
    createMetadataItem('Arquivo', book?.path, 'code'),
    createMetadataItem('Idioma', data.language),
    createMetadataItem('Ano', formatYear(data.year)),
    createMetadataItem('Editora', data.publisher),
    createMetadataItem('ISBN', data.isbn),
    createMetadataItem('Inicio', data.startDate ? activity.startDateLabel : ''),
    createMetadataItem('Fim', hasOwn(data, 'endDate') ? activity.endDateLabel : ''),
    createMetadataItem('Primeiro strike', activity.firstStrike ? activity.firstStrikeLabel : ''),
    createMetadataItem('Ultimo strike', activity.lastStrike ? activity.lastStrikeLabel : ''),
    createMetadataItem('Capa', data.coverUrl, 'link'),
  ]);
}

function createMetadataItem(label, value, type = 'text') {
  const text = normalizeOptionalText(value);

  if (!text) {
    return null;
  }

  return {
    label,
    value: text,
    type,
  };
}

function createChipItems(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values.map(normalizeOptionalText).filter(Boolean);
}

function createAvailableBooks(books = []) {
  if (!Array.isArray(books)) {
    return [];
  }

  return books
    .map((book) => ({
      slug: book.slug,
      title: book.metrics?.title || book.data?.title || book.slug,
    }))
    .filter((book) => book.slug)
    .sort((left, right) => compareText(left.title, right.title));
}

function compactItems(items) {
  return items.filter(Boolean);
}

function formatNumber(value) {
  return numberFormatter.format(toFiniteNumber(value, 0));
}

function formatPercentage(value) {
  return `${percentageFormatter.format(toFiniteNumber(value, 0))}%`;
}

function formatDate(value) {
  const dateText = normalizeOptionalText(value);

  if (!dateText) {
    return 'Nao registrado';
  }

  const parsedDate = new Date(`${dateText}T00:00:00Z`);

  if (Number.isNaN(parsedDate.getTime())) {
    return dateText;
  }

  return dateFormatter.format(parsedDate);
}

function formatPageRange(startPage, endPage) {
  return `${formatNumber(startPage)} ate ${formatNumber(endPage)}`;
}

function formatDuration(duration) {
  const minutes = toFiniteNumber(duration, 0);

  if (minutes <= 0) {
    return '';
  }

  return minutes === 1 ? '1 minuto' : `${formatNumber(minutes)} minutos`;
}

function formatYear(value) {
  return Number.isFinite(value) ? String(value) : '';
}

function formatSlugLabel(value) {
  return normalizeOptionalText(value).replaceAll('-', ' ');
}

function normalizeSlug(value) {
  return normalizeOptionalText(value);
}

function normalizeOptionalText(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function calculateProgress(currentPage, totalPages) {
  const current = toFiniteNumber(currentPage, 0);
  const total = toFiniteNumber(totalPages, 0);

  if (total <= 0) {
    return 0;
  }

  return Math.min(100, Number(((current / total) * 100).toFixed(2)));
}

function toFiniteNumber(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

function sortStrikeRecords(strikes) {
  return [...strikes].sort((left, right) => {
    const byDate = compareText(left?.data?.date || '', right?.data?.date || '');

    if (byDate !== 0) {
      return byDate;
    }

    return compareText(left?.path || left?.id || '', right?.path || right?.id || '');
  });
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
