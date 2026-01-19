import { Image, X } from "lucide-react";
import { useI18n } from "../../../i18n";

type ComposerAttachmentsProps = {
  attachments: string[];
  disabled: boolean;
  onRemoveAttachment?: (path: string) => void;
};

function fileTitle(path: string, t: (key: string) => string) {
  if (path.startsWith("data:")) {
    return t("composer.attachment_pasted");
  }
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return t("composer.attachment_image");
  }
  const normalized = path.replace(/\\/g, "/");
  const parts = normalized.split("/").filter(Boolean);
  return parts.length ? parts[parts.length - 1] : path;
}

export function ComposerAttachments({
  attachments,
  disabled,
  onRemoveAttachment,
}: ComposerAttachmentsProps) {
  const { t } = useI18n();
  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className="composer-attachments">
      {attachments.map((path) => {
        const title = fileTitle(path, t);
        const titleAttr = path.startsWith("data:")
          ? t("composer.attachment_pasted")
          : path;
        return (
          <div
            key={path}
            className="composer-attachment"
            title={titleAttr}
          >
            <span className="composer-icon" aria-hidden>
              <Image size={14} />
            </span>
            <span className="composer-attachment-name">{title}</span>
            <button
              type="button"
              className="composer-attachment-remove"
              onClick={() => onRemoveAttachment?.(path)}
              aria-label={t("composer.attachment_remove", { title })}
              disabled={disabled}
            >
              <X size={12} aria-hidden />
            </button>
          </div>
        );
      })}
    </div>
  );
}
