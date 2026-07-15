import React from 'react';

function LibraryFilterControls({
  activeFilterCount = 0,
  filters = {},
  groups = [],
  resultCount = 0,
  totalCount = 0,
  onClearFilters,
  onToggleFilter,
}) {
  const hasActiveFilters = activeFilterCount > 0;

  return (
    <section className="library-filter-controls" aria-labelledby="library-filter-title">
      <div className="library-filter-toolbar">
        <div>
          <h3 id="library-filter-title">Filtros</h3>
          <p aria-live="polite">
            {formatResultCount(resultCount, totalCount, activeFilterCount)}
          </p>
        </div>
        <button
          className="button-link"
          type="button"
          disabled={!hasActiveFilters}
          onClick={onClearFilters}
        >
          Limpar filtros
        </button>
      </div>

      <div className="library-filter-groups">
        {groups.map((group) => (
          <fieldset className="library-filter-group" key={group.id}>
            <legend>{group.label}</legend>
            {group.options.length > 0 ? (
              <div className="library-filter-options">
                {group.options.map((option) => {
                  const isSelected = (filters[group.id] || []).includes(option.value);

                  return (
                    <label
                      className={
                        isSelected
                          ? 'library-filter-option is-active'
                          : 'library-filter-option'
                      }
                      key={option.value}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleFilter(group.id, option.value)}
                      />
                      <span>{option.label}</span>
                      <small>{formatOptionCount(option.count)}</small>
                    </label>
                  );
                })}
              </div>
            ) : (
              <p className="library-filter-empty-option">Sem opcoes</p>
            )}
          </fieldset>
        ))}
      </div>
    </section>
  );
}

function formatResultCount(resultCount, totalCount, activeFilterCount) {
  const resultText = resultCount === 1 ? '1 livro exibido' : `${resultCount} livros exibidos`;
  const totalText = totalCount === 1 ? '1 livro no acervo' : `${totalCount} livros no acervo`;

  if (activeFilterCount === 0) {
    return `${resultText}; ${totalText}`;
  }

  const filterText =
    activeFilterCount === 1 ? '1 filtro ativo' : `${activeFilterCount} filtros ativos`;

  return `${resultText}; ${totalText}; ${filterText}`;
}

function formatOptionCount(count) {
  return count === 1 ? '1 livro' : `${count} livros`;
}

export default LibraryFilterControls;
