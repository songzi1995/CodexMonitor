import type { ReactNode } from "react";
import { FolderKanban, GitBranch, MessagesSquare, TerminalSquare } from "lucide-react";
import { useI18n } from "../../../i18n";

type TabKey = "projects" | "codex" | "git" | "log";

type TabBarProps = {
  activeTab: TabKey;
  onSelect: (tab: TabKey) => void;
};

export function TabBar({ activeTab, onSelect }: TabBarProps) {
  const { t } = useI18n();
  const tabs: { id: TabKey; label: string; icon: ReactNode }[] = [
    { id: "projects", label: t("app.tabs.projects"), icon: <FolderKanban className="tabbar-icon" /> },
    { id: "codex", label: t("app.tabs.codex"), icon: <MessagesSquare className="tabbar-icon" /> },
    { id: "git", label: t("app.tabs.git"), icon: <GitBranch className="tabbar-icon" /> },
    { id: "log", label: t("app.tabs.log"), icon: <TerminalSquare className="tabbar-icon" /> },
  ];
  return (
    <nav className="tabbar" aria-label={t("app.tabs.primary_label")}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`tabbar-item ${activeTab === tab.id ? "active" : ""}`}
          onClick={() => onSelect(tab.id)}
          aria-current={activeTab === tab.id ? "page" : undefined}
        >
          {tab.icon}
          <span className="tabbar-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
