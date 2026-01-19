import { FolderKanban } from "lucide-react";
import { useI18n } from "../../../i18n";

type SidebarHeaderProps = {
  onSelectHome: () => void;
  onAddWorkspace: () => void;
};

export function SidebarHeader({ onSelectHome, onAddWorkspace }: SidebarHeaderProps) {
  const { t } = useI18n();
  return (
    <div className="sidebar-header">
      <div>
        <button
          className="subtitle subtitle-button"
          onClick={onSelectHome}
          data-tauri-drag-region="false"
          aria-label="Open home"
        >
          <FolderKanban className="sidebar-nav-icon" />
          {t("app.tabs.projects")}
        </button>
      </div>
      <button
        className="ghost workspace-add"
        onClick={onAddWorkspace}
        data-tauri-drag-region="false"
        aria-label="Add workspace"
      >
        +
      </button>
    </div>
  );
}
