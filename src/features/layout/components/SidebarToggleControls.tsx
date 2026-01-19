import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import { useI18n } from "../../../i18n";

type SidebarToggleControlsProps = {
  isCompact: boolean;
  sidebarCollapsed: boolean;
  rightPanelCollapsed: boolean;
  onCollapseSidebar: () => void;
  onExpandSidebar: () => void;
  onCollapseRightPanel: () => void;
  onExpandRightPanel: () => void;
};

export function SidebarCollapseButton({
  isCompact,
  sidebarCollapsed,
  onCollapseSidebar,
}: SidebarToggleControlsProps) {
  const { t } = useI18n();
  if (isCompact || sidebarCollapsed) {
    return null;
  }
  return (
    <button
      type="button"
      className="ghost main-header-action"
      onClick={onCollapseSidebar}
      data-tauri-drag-region="false"
      aria-label={t("layout.toggle.hide_threads")}
      title={t("layout.toggle.hide_threads")}
    >
      <PanelLeftClose size={14} aria-hidden />
    </button>
  );
}

export function RightPanelCollapseButton({
  isCompact,
  rightPanelCollapsed,
  onCollapseRightPanel,
}: SidebarToggleControlsProps) {
  const { t } = useI18n();
  if (isCompact || rightPanelCollapsed) {
    return null;
  }
  return (
    <button
      type="button"
      className="ghost main-header-action"
      onClick={onCollapseRightPanel}
      data-tauri-drag-region="false"
      aria-label={t("layout.toggle.hide_git")}
      title={t("layout.toggle.hide_git")}
    >
      <PanelRightClose size={14} aria-hidden />
    </button>
  );
}

export function TitlebarExpandControls({
  isCompact,
  sidebarCollapsed,
  rightPanelCollapsed,
  onExpandSidebar,
  onExpandRightPanel,
}: SidebarToggleControlsProps) {
  const { t } = useI18n();
  if (isCompact || (!sidebarCollapsed && !rightPanelCollapsed)) {
    return null;
  }
  return (
    <div className="titlebar-controls">
      {sidebarCollapsed && (
        <div className="titlebar-toggle titlebar-toggle-left">
          <button
            type="button"
            className="ghost main-header-action"
            onClick={onExpandSidebar}
            data-tauri-drag-region="false"
            aria-label={t("layout.toggle.show_threads")}
            title={t("layout.toggle.show_threads")}
          >
            <PanelLeftOpen size={14} aria-hidden />
          </button>
        </div>
      )}
      {rightPanelCollapsed && (
        <div className="titlebar-toggle titlebar-toggle-right">
          <button
            type="button"
            className="ghost main-header-action"
            onClick={onExpandRightPanel}
            data-tauri-drag-region="false"
            aria-label={t("layout.toggle.show_git")}
            title={t("layout.toggle.show_git")}
          >
            <PanelRightOpen size={14} aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
