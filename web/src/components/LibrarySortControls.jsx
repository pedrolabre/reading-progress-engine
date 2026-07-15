import React from 'react';

function LibrarySortControls({ activeOption, options, sortId, onSortChange }) {
  return (
    <div className="library-sort-controls">
      <label htmlFor="library-sort">Ordenar biblioteca</label>
      <select
        id="library-sort"
        value={sortId}
        onChange={(event) => onSortChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      <p aria-live="polite">{activeOption.activeText}</p>
    </div>
  );
}

export default LibrarySortControls;
