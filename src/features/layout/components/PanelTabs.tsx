import type { ReactNode } from "react";
import { Folder, GitBranch, ScrollText } from "lucide-react";
import { useI18n } from "../../../i18n";

export type PanelTabId = "git" | "files" | "prompts";

type PanelTab = {
  id: PanelTabId;
  label: string;
  icon: ReactNode;
};

type PanelTabsProps = {
  active: PanelTabId;
  onSelect: (id: PanelTabId) => void;
  tabs?: PanelTab[];
};

export function PanelTabs({ active, onSelect, tabs }: PanelTabsProps) {
  const { t } = useI18n();
  const resolvedTabs =
    tabs ??
    ([
      { id: "git", label: t("app.tabs.git"), icon: <GitBranch aria-hidden /> },
      { id: "files", label: t("app.tabs.files"), icon: <Folder aria-hidden /> },
      { id: "prompts", label: t("app.tabs.prompts"), icon: <ScrollText aria-hidden /> },
    ] as PanelTab[]);
  return (
    <div className="panel-tabs" role="tablist" aria-label="Panel">
      {resolvedTabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            className={`panel-tab${isActive ? " is-active" : ""}`}
            onClick={() => onSelect(tab.id)}
            aria-current={isActive ? "page" : undefined}
            aria-label={tab.label}
            title={tab.label}
          >
            <span className="panel-tab-icon" aria-hidden>
              {tab.icon}
            </span>
          </button>
        );
      })}
    </div>
  );
}
