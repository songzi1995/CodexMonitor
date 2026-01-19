import { ScrollText, Settings } from "lucide-react";
import { useI18n } from "../../../i18n";

type SidebarCornerActionsProps = {
  onOpenSettings: () => void;
  onOpenDebug: () => void;
  showDebugButton: boolean;
};

export function SidebarCornerActions({
  onOpenSettings,
  onOpenDebug,
  showDebugButton,
}: SidebarCornerActionsProps) {
  const { t } = useI18n();
  return (
    <div className="sidebar-corner-actions">
      <button
        className="ghost sidebar-corner-button"
        type="button"
        onClick={onOpenSettings}
        aria-label={t("sidebar.open_settings")}
        title={t("sidebar.settings")}
      >
        <Settings size={14} aria-hidden />
      </button>
      {showDebugButton && (
        <button
          className="ghost sidebar-corner-button"
          type="button"
          onClick={onOpenDebug}
          aria-label={t("sidebar.open_debug")}
          title={t("sidebar.debug_log")}
        >
          <ScrollText size={14} aria-hidden />
        </button>
      )}
    </div>
  );
}
