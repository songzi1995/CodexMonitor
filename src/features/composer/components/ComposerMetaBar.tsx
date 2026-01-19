import type { CSSProperties } from "react";
import type { AccessMode, ThreadTokenUsage } from "../../../types";
import { useI18n } from "../../../i18n";

type ComposerMetaBarProps = {
  disabled: boolean;
  collaborationModes: { id: string; label: string }[];
  selectedCollaborationModeId: string | null;
  onSelectCollaborationMode: (id: string | null) => void;
  models: { id: string; displayName: string; model: string }[];
  selectedModelId: string | null;
  onSelectModel: (id: string) => void;
  reasoningOptions: string[];
  selectedEffort: string | null;
  onSelectEffort: (effort: string) => void;
  accessMode: AccessMode;
  onSelectAccessMode: (mode: AccessMode) => void;
  contextUsage?: ThreadTokenUsage | null;
};

export function ComposerMetaBar({
  disabled,
  collaborationModes,
  selectedCollaborationModeId,
  onSelectCollaborationMode,
  models,
  selectedModelId,
  onSelectModel,
  reasoningOptions,
  selectedEffort,
  onSelectEffort,
  accessMode,
  onSelectAccessMode,
  contextUsage = null,
}: ComposerMetaBarProps) {
  const { t } = useI18n();
  const contextWindow = contextUsage?.modelContextWindow ?? null;
  const lastTokens = contextUsage?.last.totalTokens ?? 0;
  const totalTokens = contextUsage?.total.totalTokens ?? 0;
  const usedTokens = lastTokens > 0 ? lastTokens : totalTokens;
  const contextFreePercent =
    contextWindow && contextWindow > 0 && usedTokens > 0
      ? Math.max(
          0,
          100 -
            Math.min(Math.max((usedTokens / contextWindow) * 100, 0), 100),
        )
      : null;
  const contextFreeLabel =
    contextFreePercent === null
      ? t("composer.context_free_unknown")
      : t("composer.context_free", {
          percent: Math.round(contextFreePercent),
        });

  return (
    <div className="composer-bar">
      <div className="composer-meta">
        {collaborationModes.length > 0 && (
          <div className="composer-select-wrap">
            <span className="composer-icon" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M7 7h10M7 12h6M7 17h8"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <select
              className="composer-select composer-select--model"
              aria-label={t("composer.collaboration_mode")}
              value={selectedCollaborationModeId ?? ""}
              onChange={(event) =>
                onSelectCollaborationMode(event.target.value || null)
              }
              disabled={disabled}
            >
              <option value="">{t("composer.collaboration_default")}</option>
              {collaborationModes.map((mode) => (
                <option key={mode.id} value={mode.id}>
                  {mode.label}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="composer-select-wrap">
          <span className="composer-icon" aria-hidden>
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M7 8V6a5 5 0 0 1 10 0v2"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <rect
                x="4.5"
                y="8"
                width="15"
                height="11"
                rx="3"
                stroke="currentColor"
                strokeWidth="1.4"
              />
              <circle cx="9" cy="13" r="1" fill="currentColor" />
              <circle cx="15" cy="13" r="1" fill="currentColor" />
              <path
                d="M9 16h6"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <select
            className="composer-select composer-select--model"
            aria-label={t("composer.model_label")}
            value={selectedModelId ?? ""}
            onChange={(event) => onSelectModel(event.target.value)}
            disabled={disabled}
          >
            {models.length === 0 && (
              <option value="">{t("composer.no_models")}</option>
            )}
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.displayName || model.model}
              </option>
            ))}
          </select>
        </div>
        <div className="composer-select-wrap">
          <span className="composer-icon" aria-hidden>
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M8.5 4.5a3.5 3.5 0 0 0-3.46 4.03A4 4 0 0 0 6 16.5h2"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <path
                d="M15.5 4.5a3.5 3.5 0 0 1 3.46 4.03A4 4 0 0 1 18 16.5h-2"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <path
                d="M9 12h6"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <path
                d="M12 12v6"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <select
            className="composer-select composer-select--effort"
            aria-label={t("composer.thinking_mode")}
            value={selectedEffort ?? ""}
            onChange={(event) => onSelectEffort(event.target.value)}
            disabled={disabled}
          >
            {reasoningOptions.length === 0 && (
              <option value="">{t("composer.reasoning_default")}</option>
            )}
            {reasoningOptions.map((effort) => (
              <option key={effort} value={effort}>
                {effort}
              </option>
            ))}
          </select>
        </div>
        <div className="composer-select-wrap">
          <span className="composer-icon" aria-hidden>
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M12 4l7 3v5c0 4.5-3 7.5-7 8-4-0.5-7-3.5-7-8V7l7-3z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
              <path
                d="M9.5 12.5l1.8 1.8 3.7-4"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <select
            className="composer-select composer-select--approval"
            aria-label={t("composer.access_label")}
            disabled={disabled}
            value={accessMode}
            onChange={(event) =>
              onSelectAccessMode(event.target.value as AccessMode)
            }
          >
            <option value="read-only">{t("composer.access_read_only")}</option>
            <option value="current">{t("composer.access_on_request")}</option>
            <option value="full-access">{t("composer.access_full")}</option>
          </select>
        </div>
      </div>
      <div className="composer-context">
        <div
          className="composer-context-ring"
          data-tooltip={contextFreeLabel}
          aria-label={contextFreeLabel}
          style={
            {
              "--context-free": contextFreePercent ?? 0,
            } as CSSProperties
          }
        >
          <span className="composer-context-value">●</span>
        </div>
      </div>
    </div>
  );
}
