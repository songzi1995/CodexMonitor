import type { MouseEvent as ReactMouseEvent } from "react";
import type { DebugEntry } from "../../../types";
import { useI18n } from "../../../i18n";

type DebugPanelProps = {
  entries: DebugEntry[];
  isOpen: boolean;
  onClear: () => void;
  onCopy: () => void;
  onResizeStart?: (event: ReactMouseEvent) => void;
  variant?: "dock" | "full";
};

function formatPayload(payload: unknown) {
  if (payload === undefined) {
    return "";
  }
  if (typeof payload === "string") {
    return payload;
  }
  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return String(payload);
  }
}

export function DebugPanel({
  entries,
  isOpen,
  onClear,
  onCopy,
  onResizeStart,
  variant = "dock",
}: DebugPanelProps) {
  const { t } = useI18n();
  const isVisible = variant === "full" || isOpen;
  if (!isVisible) {
    return null;
  }

  return (
    <section
      className={`debug-panel ${variant === "full" ? "full" : isOpen ? "open" : ""}`}
    >
      {variant !== "full" && isOpen && onResizeStart && (
        <div
          className="debug-panel-resizer"
          role="separator"
          aria-orientation="horizontal"
          aria-label={t("debug.resize_label")}
          onMouseDown={onResizeStart}
        />
      )}
      <div className="debug-header">
        <div className="debug-title">{t("debug.title")}</div>
        <div className="debug-actions">
          <button className="ghost" onClick={onCopy}>
            {t("debug.copy")}
          </button>
          <button className="ghost" onClick={onClear}>
            {t("debug.clear")}
          </button>
        </div>
      </div>
      {isOpen && (
        <div className="debug-list">
          {entries.length === 0 && (
            <div className="debug-empty">{t("debug.empty")}</div>
          )}
          {entries.map((entry) => (
            <div key={entry.id} className="debug-row">
              <div className="debug-meta">
                <span className={`debug-source ${entry.source}`}>
                  {entry.source}
                </span>
                <span className="debug-time">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>
                <span className="debug-label">{entry.label}</span>
              </div>
              {entry.payload !== undefined && (
                <pre className="debug-payload">
                  {formatPayload(entry.payload)}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
