function ReferenceModeControl({
  availableCount,
  emptyMessage,
  existingLabel,
  existingModeValue = 'existing',
  id,
  loadError,
  manualLabel,
  manualModeValue = 'manual',
  mode,
  onChange,
}) {
  return (
    <fieldset className="reference-mode-control form-field-wide">
      <legend>Referencia</legend>
      <div className="reference-mode-options">
        <label className={mode === existingModeValue ? 'is-active' : undefined}>
          <input
            checked={mode === existingModeValue}
            disabled={availableCount === 0}
            name={id}
            onChange={() => onChange(existingModeValue)}
            type="radio"
            value={existingModeValue}
          />
          <span>{existingLabel}</span>
          <small>{availableCount}</small>
        </label>
        <label className={mode === manualModeValue ? 'is-active' : undefined}>
          <input
            checked={mode === manualModeValue}
            name={id}
            onChange={() => onChange(manualModeValue)}
            type="radio"
            value={manualModeValue}
          />
          <span>{manualLabel}</span>
        </label>
      </div>
      {availableCount === 0 ? (
        <p className="reference-empty-note">{loadError || emptyMessage}</p>
      ) : null}
    </fieldset>
  );
}

export default ReferenceModeControl;
