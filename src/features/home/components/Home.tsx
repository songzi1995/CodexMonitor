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
  onSelectThread: (workspaceId: string, threadId: string) => void;
};

export function Home({
  onOpenProject,
  onAddWorkspace,
  latestAgentRuns,
  isLoadingLatestAgents,
  onSelectThread,
}: HomeProps) {
  const { t } = useI18n();
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
    </div>
  );
}
