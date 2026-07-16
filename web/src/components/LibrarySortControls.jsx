import React from 'react';

function LibrarySortControls({ activeOption, options, sortId, onSortChange }) {
  return (
    <div className="library-sort-controls" role="group" aria-labelledby="library-sort-label">
      <label htmlFor="library-sort" id="library-sort-label">
        Ordenar biblioteca
      </label>
      <select
        id="library-sort"
        aria-controls="library-results"
        aria-describedby="library-sort-status"
        value={sortId}
        onChange={(event) => onSortChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      <p aria-live="polite" id="library-sort-status">
        {activeOption.activeText}
      </p>
    </div>
  );
}

export default LibrarySortControls;
