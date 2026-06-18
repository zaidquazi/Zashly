/** Reusable settings row with label, description, and control. */
const SettingsToggleRow = ({ title, description, children, className = "" }) => (
  <div
    className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 bg-base-200/50 rounded-xl ${className}`}
  >
    <div className="min-w-0 flex-1">
      <h3 className="font-semibold">{title}</h3>
      {description && <p className="text-sm opacity-60 mt-0.5">{description}</p>}
    </div>
    <div className="shrink-0 w-full sm:w-auto flex items-center justify-between sm:justify-end gap-3">
      {children}
    </div>
  </div>
);

export const SettingsToggle = ({ checked, onChange, label, title }) => (
  <>
    {label && (
      <span className="text-sm opacity-60 sm:hidden">{checked ? "On" : "Off"}</span>
    )}
    <input
      type="checkbox"
      className="toggle toggle-primary"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      aria-label={label || title}
    />
  </>
);

export default SettingsToggleRow;
