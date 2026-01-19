import { useCallback } from "react";
import { LogicalPosition } from "@tauri-apps/api/dpi";
import { Menu, MenuItem } from "@tauri-apps/api/menu";
import { getCurrentWindow } from "@tauri-apps/api/window";
import type { QueuedMessage } from "../../../types";
import { useI18n } from "../../../i18n";

type ComposerQueueProps = {
  queuedMessages: QueuedMessage[];
  onEditQueued?: (item: QueuedMessage) => void;
  onDeleteQueued?: (id: string) => void;
};

export function ComposerQueue({
  queuedMessages,
  onEditQueued,
  onDeleteQueued,
}: ComposerQueueProps) {
  const { t } = useI18n();
  const handleQueueMenu = useCallback(
    async (event: React.MouseEvent, item: QueuedMessage) => {
      event.preventDefault();
      event.stopPropagation();
      const { clientX, clientY } = event;
      const editItem = await MenuItem.new({
        text: t("composer.queue_edit"),
        action: () => onEditQueued?.(item),
      });
      const deleteItem = await MenuItem.new({
        text: t("composer.queue_delete"),
        action: () => onDeleteQueued?.(item.id),
      });
      const menu = await Menu.new({ items: [editItem, deleteItem] });
      const window = getCurrentWindow();
      const position = new LogicalPosition(clientX, clientY);
      await menu.popup(position, window);
    },
    [onDeleteQueued, onEditQueued, t],
  );

  if (queuedMessages.length === 0) {
    return null;
  }

  return (
    <div className="composer-queue">
      <div className="composer-queue-title">{t("composer.queue_title")}</div>
      <div className="composer-queue-list">
        {queuedMessages.map((item) => (
          <div key={item.id} className="composer-queue-item">
            <span className="composer-queue-text">
              {item.text ||
                (item.images?.length
                  ? item.images.length === 1
                    ? t("composer.queue_image_single")
                    : t("composer.queue_image_plural")
                  : "")}
              {item.images?.length
                ? ` · ${t(
                    item.images.length === 1
                      ? "composer.queue_image_count_single"
                      : "composer.queue_image_count_plural",
                    { count: item.images.length },
                  )}`
                : ""}
            </span>
            <button
              className="composer-queue-menu"
              onClick={(event) => handleQueueMenu(event, item)}
              aria-label={t("composer.queue_menu")}
            >
              ...
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
