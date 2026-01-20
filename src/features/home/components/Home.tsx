import { RefreshCw } from "lucide-react";
import type { LocalUsageSnapshot } from "../../../types";
import { formatRelativeTime } from "../../../utils/time";
import { useI18n } from "../../../i18n";

type LatestAgentRun = {
  message: string;
  timestamp: number;
  projectName: string;
  groupName?: string | null;
  workspaceId: string;
  threadId: string;
  isProcessing: boolean;
};

type HomeProps = {
  onOpenProject: () => void;
  onAddWorkspace: () => void;
  latestAgentRuns: LatestAgentRun[];
  isLoadingLatestAgents: boolean;
  localUsageSnapshot: LocalUsageSnapshot | null;
  isLoadingLocalUsage: boolean;
  localUsageError: string | null;
  onRefreshLocalUsage: () => void;
  onSelectThread: (workspaceId: string, threadId: string) => void;
};

export function Home({
  onOpenProject,
  onAddWorkspace,
  latestAgentRuns,
  isLoadingLatestAgents,
  localUsageSnapshot,
  isLoadingLocalUsage,
  localUsageError,
  onRefreshLocalUsage,
  onSelectThread,
}: HomeProps) {
  const { t } = useI18n();
  const formatCompactNumber = (value: number | null | undefined) => {
    if (value === null || value === undefined) {
      return "--";
    }
    if (value >= 1_000_000_000) {
      const scaled = value / 1_000_000_000;
      return `${scaled.toFixed(scaled >= 10 ? 0 : 1)}b`;
    }
    if (value >= 1_000_000) {
      const scaled = value / 1_000_000;
      return `${scaled.toFixed(scaled >= 10 ? 0 : 1)}m`;
    }
    if (value >= 1_000) {
      const scaled = value / 1_000;
      return `${scaled.toFixed(scaled >= 10 ? 0 : 1)}k`;
    }
    return String(value);
  };

  const formatCount = (value: number | null | undefined) => {
    if (value === null || value === undefined) {
      return "--";
    }
    return new Intl.NumberFormat().format(value);
  };

  const formatDayLabel = (value: string | null | undefined) => {
    if (!value) {
      return "--";
    }
    const [year, month, day] = value.split("-").map(Number);
    if (!year || !month || !day) {
      return value;
    }
    const date = new Date(year, month - 1, day);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const usageTotals = localUsageSnapshot?.totals ?? null;
  const usageDays = localUsageSnapshot?.days ?? [];
  const last7Days = usageDays.slice(-7);
  const maxTokens = Math.max(
    1,
    ...last7Days.map((day) => day.totalTokens),
  );
  const updatedLabel = localUsageSnapshot
    ? t("home.usage.updated", {
        time: formatRelativeTime(localUsageSnapshot.updatedAt),
      })
    : null;
  const showUsageSkeleton = isLoadingLocalUsage && !localUsageSnapshot;
  const showUsageEmpty = !isLoadingLocalUsage && !localUsageSnapshot;
  return (
    <div className="home">
      <div className="home-hero">
        <div className="home-title">{t("home.hero_title")}</div>
        <div className="home-subtitle">
          {t("home.hero_subtitle")}
        </div>
      </div>
      <div className="home-latest">
        <div className="home-latest-header">
          <div className="home-latest-label">{t("home.latest_agents")}</div>
        </div>
        {latestAgentRuns.length > 0 ? (
          <div className="home-latest-grid">
            {latestAgentRuns.map((run) => (
              <button
                className="home-latest-card home-latest-card-button"
                key={run.threadId}
                onClick={() => onSelectThread(run.workspaceId, run.threadId)}
                type="button"
              >
                <div className="home-latest-card-header">
                  <div className="home-latest-project">
                    <span className="home-latest-project-name">{run.projectName}</span>
                    {run.groupName && (
                      <span className="home-latest-group">{run.groupName}</span>
                    )}
                  </div>
                  <div className="home-latest-time">
                    {formatRelativeTime(run.timestamp)}
                  </div>
                </div>
                <div className="home-latest-message">
                  {run.message.trim() || t("home.agent_replied")}
                </div>
                {run.isProcessing && (
                  <div className="home-latest-status">{t("home.running")}</div>
                )}
              </button>
            ))}
          </div>
        ) : isLoadingLatestAgents ? (
          <div
            className="home-latest-grid home-latest-grid-loading"
            aria-label={t("home.loading_agents")}
          >
            {Array.from({ length: 3 }).map((_, index) => (
              <div className="home-latest-card home-latest-card-skeleton" key={index}>
                <div className="home-latest-card-header">
                  <span className="home-latest-skeleton home-latest-skeleton-title" />
                  <span className="home-latest-skeleton home-latest-skeleton-time" />
                </div>
                <span className="home-latest-skeleton home-latest-skeleton-line" />
                <span className="home-latest-skeleton home-latest-skeleton-line short" />
              </div>
            ))}
          </div>
        ) : (
          <div className="home-latest-empty">
            <div className="home-latest-empty-title">
              {t("home.empty_title")}
            </div>
            <div className="home-latest-empty-subtitle">
              {t("home.empty_subtitle")}
            </div>
          </div>
        )}
      </div>
      <div className="home-actions">
        <button
          className="home-button primary"
          onClick={onOpenProject}
          data-tauri-drag-region="false"
        >
          <span className="home-icon" aria-hidden>
            ⌘
          </span>
          {t("home.open_project")}
        </button>
        <button
          className="home-button secondary"
          onClick={onAddWorkspace}
          data-tauri-drag-region="false"
        >
          <span className="home-icon" aria-hidden>
            +
          </span>
          {t("home.add_workspace")}
        </button>
      </div>
      <div className="home-usage">
        <div className="home-section-header">
          <div className="home-section-title">{t("home.usage.title")}</div>
          <div className="home-section-meta-row">
            {updatedLabel && <div className="home-section-meta">{updatedLabel}</div>}
            <button
              type="button"
              className={
                isLoadingLocalUsage
                  ? "home-usage-refresh is-loading"
                  : "home-usage-refresh"
              }
              onClick={onRefreshLocalUsage}
              disabled={isLoadingLocalUsage}
              aria-label={t("home.usage.refresh")}
              title={t("home.usage.refresh")}
            >
              <RefreshCw
                className={
                  isLoadingLocalUsage
                    ? "home-usage-refresh-icon spinning"
                    : "home-usage-refresh-icon"
                }
                aria-hidden
              />
            </button>
          </div>
        </div>
        {showUsageSkeleton ? (
          <div className="home-usage-skeleton">
            <div className="home-usage-grid">
              {Array.from({ length: 4 }).map((_, index) => (
                <div className="home-usage-card" key={index}>
                  <span className="home-latest-skeleton home-usage-skeleton-label" />
                  <span className="home-latest-skeleton home-usage-skeleton-value" />
                </div>
              ))}
            </div>
            <div className="home-usage-chart-card">
              <span className="home-latest-skeleton home-usage-skeleton-chart" />
            </div>
          </div>
        ) : showUsageEmpty ? (
          <div className="home-usage-empty">
            <div className="home-usage-empty-title">
              {t("home.usage.empty_title")}
            </div>
            <div className="home-usage-empty-subtitle">
              {t("home.usage.empty_subtitle")}
            </div>
            {localUsageError && (
              <div className="home-usage-error">{localUsageError}</div>
            )}
          </div>
        ) : (
          <>
            <div className="home-usage-grid">
              <div className="home-usage-card">
                <div className="home-usage-label">
                  {t("home.usage.last_7_days")}
                </div>
                <div className="home-usage-value">
                  <span className="home-usage-number">
                    {formatCompactNumber(usageTotals?.last7DaysTokens)}
                  </span>
                  <span className="home-usage-suffix">
                    {t("home.usage.tokens")}
                  </span>
                </div>
                <div className="home-usage-caption">
                  {t("home.usage.avg_per_day", {
                    value: formatCompactNumber(usageTotals?.averageDailyTokens),
                  })}
                </div>
              </div>
              <div className="home-usage-card">
                <div className="home-usage-label">
                  {t("home.usage.last_30_days")}
                </div>
                <div className="home-usage-value">
                  <span className="home-usage-number">
                    {formatCompactNumber(usageTotals?.last30DaysTokens)}
                  </span>
                  <span className="home-usage-suffix">
                    {t("home.usage.tokens")}
                  </span>
                </div>
                <div className="home-usage-caption">
                  {t("home.usage.total", {
                    value: formatCount(usageTotals?.last30DaysTokens),
                  })}
                </div>
              </div>
              <div className="home-usage-card">
                <div className="home-usage-label">
                  {t("home.usage.cache_hit_rate")}
                </div>
                <div className="home-usage-value">
                  <span className="home-usage-number">
                    {usageTotals
                      ? `${usageTotals.cacheHitRatePercent.toFixed(1)}%`
                      : "--"}
                  </span>
                </div>
                <div className="home-usage-caption">
                  {t("home.usage.last_7_days")}
                </div>
              </div>
              <div className="home-usage-card">
                <div className="home-usage-label">
                  {t("home.usage.peak_day")}
                </div>
                <div className="home-usage-value">
                  <span className="home-usage-number">
                    {formatDayLabel(usageTotals?.peakDay)}
                  </span>
                </div>
                <div className="home-usage-caption">
                  {t("home.usage.tokens_with_value", {
                    value: formatCompactNumber(usageTotals?.peakDayTokens),
                  })}
                </div>
              </div>
            </div>
            <div className="home-usage-chart-card">
              <div className="home-usage-chart">
                {last7Days.map((day) => {
                  const height = Math.max(
                    6,
                    Math.round((day.totalTokens / maxTokens) * 100),
                  );
                  return (
                    <div
                      className="home-usage-bar"
                      key={day.day}
                      data-value={t("home.usage.chart_label", {
                        day: formatDayLabel(day.day),
                        tokens: formatCount(day.totalTokens),
                      })}
                    >
                      <span
                        className="home-usage-bar-fill"
                        style={{ height: `${height}%` }}
                      />
                      <span className="home-usage-bar-label">
                        {formatDayLabel(day.day)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="home-usage-models">
              <div className="home-usage-models-label">
                {t("home.usage.top_models")}
              </div>
              <div className="home-usage-models-list">
                {localUsageSnapshot?.topModels?.length ? (
                  localUsageSnapshot.topModels.map((model) => (
                    <span
                      className="home-usage-model-chip"
                      key={model.model}
                      title={t("home.usage.model_tokens", {
                        model: model.model,
                        tokens: formatCount(model.tokens),
                      })}
                    >
                      {model.model}
                      <span className="home-usage-model-share">
                        {model.sharePercent.toFixed(1)}%
                      </span>
                    </span>
                  ))
                ) : (
                  <span className="home-usage-model-empty">
                    {t("home.usage.no_models")}
                  </span>
                )}
              </div>
              {localUsageError && (
                <div className="home-usage-error">{localUsageError}</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
