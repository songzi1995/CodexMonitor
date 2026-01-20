import type { ReactNode } from "react";
import { GitBranch, MessagesSquare, TerminalSquare } from "lucide-react";
import { useI18n } from "../../../i18n";

type TabletNavTab = "codex" | "git" | "log";

type TabletNavProps = {
  activeTab: TabletNavTab;
  onSelect: (tab: TabletNavTab) => void;
};

export function TabletNav({ activeTab, onSelect }: TabletNavProps) {
  const { t } = useI18n();
  const tabs: { id: TabletNavTab; label: string; icon: ReactNode }[] = [
    { id: "codex", label: t("app.tabs.codex"), icon: <MessagesSquare className="tablet-nav-icon" /> },
    { id: "git", label: t("app.tabs.git"), icon: <GitBranch className="tablet-nav-icon" /> },
    { id: "log", label: t("app.tabs.log"), icon: <TerminalSquare className="tablet-nav-icon" /> },
  ];
  return (
    <nav className="tablet-nav" aria-label={t("app.tabs.workspace_label")}>
      <div className="tablet-nav-group">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`tablet-nav-item ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => onSelect(tab.id)}
            aria-current={activeTab === tab.id ? "page" : undefined}
          >
            {tab.icon}
            <span className="tablet-nav-label">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
