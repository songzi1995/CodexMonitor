import { useEffect, useRef } from "react";
import { useI18n } from "../../../i18n";

type WorktreePromptProps = {
  workspaceName: string;
  branch: string;
  error?: string | null;
  onChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  isBusy?: boolean;
};

export function WorktreePrompt({
  workspaceName,
  branch,
  error = null,
  onChange,
  onCancel,
  onConfirm,
  isBusy = false,
}: WorktreePromptProps) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  return (
    <div className="worktree-modal" role="dialog" aria-modal="true">
      <div
        className="worktree-modal-backdrop"
        onClick={() => {
          if (!isBusy) {
            onCancel();
          }
        }}
      />
      <div className="worktree-modal-card">
        <div className="worktree-modal-title">
          {t("workspaces.worktree_prompt.title")}
        </div>
        <div className="worktree-modal-subtitle">
          {t("workspaces.worktree_prompt.subtitle", { name: workspaceName })}
        </div>
        <label className="worktree-modal-label" htmlFor="worktree-branch">
          {t("workspaces.worktree_prompt.branch_label")}
        </label>
        <input
          id="worktree-branch"
          ref={inputRef}
          className="worktree-modal-input"
          value={branch}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              if (!isBusy) {
                onCancel();
              }
            }
            if (event.key === "Enter" && !isBusy) {
              event.preventDefault();
              onConfirm();
            }
          }}
        />
        {error && <div className="worktree-modal-error">{error}</div>}
        <div className="worktree-modal-actions">
          <button
            className="ghost worktree-modal-button"
            onClick={onCancel}
            type="button"
            disabled={isBusy}
          >
            {t("common.cancel")}
          </button>
          <button
            className="primary worktree-modal-button"
            onClick={onConfirm}
            type="button"
            disabled={isBusy || branch.trim().length === 0}
          >
            {t("common.create")}
          </button>
        </div>
      </div>
    </div>
  );
}
