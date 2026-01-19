import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import type { CustomPromptOption } from "../../../types";
import { expandCustomPromptText, getPromptArgumentHint } from "../../../utils/customPrompts";
import { PanelTabs, type PanelTabId } from "../../layout/components/PanelTabs";
import { Menu, MenuItem } from "@tauri-apps/api/menu";
import { LogicalPosition } from "@tauri-apps/api/dpi";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { MoreHorizontal, Plus, ScrollText, Search } from "lucide-react";
import { useI18n } from "../../../i18n";

type PromptPanelProps = {
  prompts: CustomPromptOption[];
  workspacePath: string | null;
  filePanelMode: PanelTabId;
  onFilePanelModeChange: (mode: PanelTabId) => void;
  onSendPrompt: (text: string) => void | Promise<void>;
  onSendPromptToNewAgent: (text: string) => void | Promise<void>;
  onCreatePrompt: (data: {
    scope: "workspace" | "global";
    name: string;
    description?: string | null;
    argumentHint?: string | null;
    content: string;
  }) => void | Promise<void>;
  onUpdatePrompt: (data: {
    path: string;
    name: string;
    description?: string | null;
    argumentHint?: string | null;
    content: string;
  }) => void | Promise<void>;
  onDeletePrompt: (path: string) => void | Promise<void>;
  onMovePrompt: (data: { path: string; scope: "workspace" | "global" }) => void | Promise<void>;
  onRevealWorkspacePrompts: () => void | Promise<void>;
  onRevealGeneralPrompts: () => void | Promise<void>;
};

const PROMPTS_PREFIX = "prompts:";

type PromptEditorState = {
  mode: "create" | "edit";
  scope: "workspace" | "global";
  name: string;
  description: string;
  argumentHint: string;
  content: string;
  path?: string;
};

function buildPromptCommand(name: string, args: string) {
  const trimmedArgs = args.trim();
  return `/${PROMPTS_PREFIX}${name}${trimmedArgs ? ` ${trimmedArgs}` : ""}`;
}

function isWorkspacePrompt(prompt: CustomPromptOption) {
  return prompt.scope === "workspace";
}

export function PromptPanel({
  prompts,
  workspacePath,
  filePanelMode,
  onFilePanelModeChange,
  onSendPrompt,
  onSendPromptToNewAgent,
  onCreatePrompt,
  onUpdatePrompt,
  onDeletePrompt,
  onMovePrompt,
  onRevealWorkspacePrompts,
  onRevealGeneralPrompts,
}: PromptPanelProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [argsByPrompt, setArgsByPrompt] = useState<Record<string, string>>({});
  const [editor, setEditor] = useState<PromptEditorState | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingDeletePath, setPendingDeletePath] = useState<string | null>(null);
  const [highlightKey, setHighlightKey] = useState<string | null>(null);
  const highlightTimer = useRef<number | null>(null);
  const normalizedQuery = query.trim().toLowerCase();

  const showError = (error: unknown) => {
    window.alert(error instanceof Error ? error.message : String(error));
  };

  const resetEditorState = () => {
    setEditorError(null);
    setPendingDeletePath(null);
  };

  const updateEditor = (patch: Partial<PromptEditorState>) => {
    setEditor((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  useEffect(() => {
    return () => {
      if (highlightTimer.current) {
        window.clearTimeout(highlightTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!pendingDeletePath) {
      return;
    }
    const stillExists = prompts.some((prompt) => prompt.path === pendingDeletePath);
    if (!stillExists) {
      setPendingDeletePath(null);
    }
  }, [pendingDeletePath, prompts]);

  const triggerHighlight = (key: string) => {
    if (!key) {
      return;
    }
    if (highlightTimer.current) {
      window.clearTimeout(highlightTimer.current);
    }
    setHighlightKey(key);
    highlightTimer.current = window.setTimeout(() => {
      setHighlightKey(null);
    }, 650);
  };

  const buildPromptText = (prompt: CustomPromptOption, args: string) => {
    const command = buildPromptCommand(prompt.name, args);
    const expansion = expandCustomPromptText(command, [prompt]);
    if (expansion && "error" in expansion) {
      showError(expansion.error);
      return null;
    }
    if (expansion && "expanded" in expansion) {
      return expansion.expanded;
    }
    return prompt.content;
  };

  const filteredPrompts = useMemo(() => {
    if (!normalizedQuery) {
      return prompts;
    }
    return prompts.filter((prompt) => {
      const haystack = `${prompt.name} ${prompt.description ?? ""} ${prompt.path}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [normalizedQuery, prompts]);

  const { workspacePrompts, globalPrompts } = useMemo(() => {
    const workspaceEntries: CustomPromptOption[] = [];
    const globalEntries: CustomPromptOption[] = [];
    filteredPrompts.forEach((prompt) => {
      if (isWorkspacePrompt(prompt)) {
        workspaceEntries.push(prompt);
      } else {
        globalEntries.push(prompt);
      }
    });
    return { workspacePrompts: workspaceEntries, globalPrompts: globalEntries };
  }, [filteredPrompts]);

  const totalCount = filteredPrompts.length;
  const hasPrompts = totalCount > 0;
  const promptCountSuffix = totalCount === 1 ? "" : "s";

  const handleArgsChange = (key: string, value: string) => {
    setArgsByPrompt((prev) => ({ ...prev, [key]: value }));
  };

  const startCreate = (scope: "workspace" | "global") => {
    resetEditorState();
    setEditor({
      mode: "create",
      scope,
      name: "",
      description: "",
      argumentHint: "",
      content: "",
    });
  };

  const startEdit = (prompt: CustomPromptOption) => {
    const scope = isWorkspacePrompt(prompt) ? "workspace" : "global";
    resetEditorState();
    setEditor({
      mode: "edit",
      scope,
      name: prompt.name,
      description: prompt.description ?? "",
      argumentHint: prompt.argumentHint ?? "",
      content: prompt.content ?? "",
      path: prompt.path,
    });
  };

  const handleSave = async () => {
    if (!editor || isSaving) {
      return;
    }
    const name = editor.name.trim();
    if (!name) {
      setEditorError(t("prompts.editor.error_name_required"));
      return;
    }
    if (/\s/.test(name)) {
      setEditorError(t("prompts.editor.error_name_whitespace"));
      return;
    }
    setEditorError(null);
    setIsSaving(true);
    const description = editor.description.trim() || null;
    const argumentHint = editor.argumentHint.trim() || null;
    const content = editor.content;
    try {
      if (editor.mode === "create") {
        await onCreatePrompt({
          scope: editor.scope,
          name,
          description,
          argumentHint,
          content,
        });
        triggerHighlight(name);
      } else if (editor.path) {
        await onUpdatePrompt({
          path: editor.path,
          name,
          description,
          argumentHint,
          content,
        });
        triggerHighlight(editor.path ?? name);
      }
      setEditor(null);
    } catch (error) {
      setEditorError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRequest = (prompt: CustomPromptOption) => {
    if (!prompt.path) {
      return;
    }
    setPendingDeletePath(prompt.path);
  };

  const handleDeleteConfirm = async (prompt: CustomPromptOption) => {
    if (!prompt.path) {
      return;
    }
    try {
      await onDeletePrompt(prompt.path);
      setPendingDeletePath((current) =>
        current === prompt.path ? null : current,
      );
    } catch (error) {
      showError(error);
    }
  };

  const handleMove = async (prompt: CustomPromptOption, scope: "workspace" | "global") => {
    if (!prompt.path) {
      return;
    }
    try {
      await onMovePrompt({ path: prompt.path, scope });
      triggerHighlight(prompt.name);
    } catch (error) {
      showError(error);
    }
  };

  const showPromptMenu = async (
    event: ReactMouseEvent<HTMLButtonElement>,
    prompt: CustomPromptOption,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    const scope = isWorkspacePrompt(prompt) ? "workspace" : "global";
    const nextScope = scope === "workspace" ? "global" : "workspace";
    const menu = await Menu.new({
      items: [
        await MenuItem.new({
          text: t("common.edit"),
          action: () => startEdit(prompt),
        }),
        await MenuItem.new({
          text:
            nextScope === "workspace"
              ? t("prompts.move_to_workspace")
              : t("prompts.move_to_general"),
          action: () => void handleMove(prompt, nextScope),
        }),
        await MenuItem.new({
          text: t("common.delete"),
          action: () => handleDeleteRequest(prompt),
        }),
      ],
    });
    const position = new LogicalPosition(event.clientX, event.clientY);
    const window = getCurrentWindow();
    await menu.popup(position, window);
  };

  const renderPromptRow = (prompt: CustomPromptOption) => {
    const hint = getPromptArgumentHint(prompt);
    const showArgsInput = Boolean(hint);
    const key = prompt.path || prompt.name;
    const argsValue = argsByPrompt[key] ?? "";
    const effectiveArgs = showArgsInput ? argsValue : "";
    const isHighlighted = highlightKey === prompt.path || highlightKey === prompt.name;
    return (
      <div className={`prompt-row${isHighlighted ? " is-highlight" : ""}`} key={key}>
        <div className="prompt-row-header">
          <div className="prompt-name">{prompt.name}</div>
          {prompt.description && (
            <div className="prompt-description">{prompt.description}</div>
          )}
        </div>
        {hint && <div className="prompt-hint">{hint}</div>}
        <div className="prompt-actions">
          {showArgsInput ? (
            <input
              className="prompt-args-input"
              type="text"
              placeholder={hint ?? t("prompts.args_placeholder")}
              value={argsValue}
              onChange={(event) => handleArgsChange(key, event.target.value)}
              aria-label={t("prompts.args_aria", { name: prompt.name })}
            />
          ) : null}
          <button
            type="button"
            className="ghost prompt-action"
            onClick={() => {
              const text = buildPromptText(prompt, effectiveArgs);
              if (!text) {
                return;
              }
              void onSendPrompt(text);
            }}
            title={t("prompts.send_current_title")}
          >
            {t("prompts.send")}
          </button>
          <button
            type="button"
            className="ghost prompt-action"
            onClick={() => {
              const text = buildPromptText(prompt, effectiveArgs);
              if (!text) {
                return;
              }
              void onSendPromptToNewAgent(text);
            }}
            title={t("prompts.send_new_title")}
          >
            {t("prompts.send_new")}
          </button>
          <button
            type="button"
            className="ghost icon-button prompt-action-menu"
            onClick={(event) => void showPromptMenu(event, prompt)}
            aria-label={t("prompts.actions_label")}
            title={t("prompts.actions_label")}
          >
            <MoreHorizontal aria-hidden />
          </button>
        </div>
        {pendingDeletePath === prompt.path && (
          <div className="prompt-delete-confirm">
            <span>{t("prompts.delete_confirm")}</span>
            <button
              type="button"
              className="ghost prompt-action"
              onClick={() => void handleDeleteConfirm(prompt)}
            >
              {t("common.delete")}
            </button>
            <button
              type="button"
              className="ghost prompt-action"
              onClick={() => setPendingDeletePath(null)}
            >
              {t("common.cancel")}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="diff-panel prompt-panel">
      <div className="git-panel-header">
        <PanelTabs active={filePanelMode} onSelect={onFilePanelModeChange} />
        <div className="prompt-panel-meta">
          {hasPrompts
            ? t("prompts.count", { count: totalCount, suffix: promptCountSuffix })
            : t("prompts.none")}
        </div>
      </div>
      {editor && (
        <div className="prompt-editor">
          <div className="prompt-editor-row">
            <label className="prompt-editor-label">
              {t("prompts.editor.name")}
              <input
                className="prompt-args-input"
                type="text"
                value={editor.name}
                onChange={(event) => updateEditor({ name: event.target.value })}
                placeholder={t("prompts.editor.name_placeholder")}
              />
            </label>
            <label className="prompt-editor-label">
              {t("prompts.editor.scope")}
              <select
                className="prompt-scope-select"
                value={editor.scope}
                onChange={(event) =>
                  updateEditor({
                    scope: event.target.value as PromptEditorState["scope"],
                  })
                }
                disabled={editor.mode === "edit"}
              >
                <option value="workspace">{t("prompts.editor.scope_workspace")}</option>
                <option value="global">{t("prompts.editor.scope_general")}</option>
              </select>
            </label>
          </div>
          <div className="prompt-editor-row">
            <label className="prompt-editor-label">
              {t("prompts.editor.description")}
              <input
                className="prompt-args-input"
                type="text"
                value={editor.description}
                onChange={(event) => updateEditor({ description: event.target.value })}
                placeholder={t("prompts.editor.description_placeholder")}
              />
            </label>
            <label className="prompt-editor-label">
              {t("prompts.editor.argument_hint")}
              <input
                className="prompt-args-input"
                type="text"
                value={editor.argumentHint}
                onChange={(event) => updateEditor({ argumentHint: event.target.value })}
                placeholder={t("prompts.editor.argument_hint_placeholder")}
              />
            </label>
          </div>
          <label className="prompt-editor-label">
            {t("prompts.editor.content")}
            <textarea
              className="prompt-editor-textarea"
              value={editor.content}
              onChange={(event) => updateEditor({ content: event.target.value })}
              placeholder={t("prompts.editor.content_placeholder")}
              rows={6}
            />
          </label>
          {editorError && <div className="prompt-editor-error">{editorError}</div>}
          <div className="prompt-editor-actions">
            <button
              type="button"
              className="ghost prompt-action"
              onClick={() => setEditor(null)}
              disabled={isSaving}
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              className="ghost prompt-action"
              onClick={() => void handleSave()}
              disabled={isSaving}
            >
              {editor.mode === "create" ? t("common.create") : t("common.save")}
            </button>
          </div>
        </div>
      )}
      <div className="file-tree-search">
        <Search className="file-tree-search-icon" aria-hidden />
        <input
          className="file-tree-search-input"
          type="search"
          placeholder={t("prompts.filter_placeholder")}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label={t("prompts.filter_aria")}
        />
      </div>
      <div className="prompt-section">
        <div className="prompt-section-header">
          <div className="prompt-section-title">{t("prompts.section.workspace")}</div>
          <button
            type="button"
            className="ghost icon-button prompt-section-add"
            onClick={() => startCreate("workspace")}
            aria-label={t("prompts.add_workspace")}
            title={t("prompts.add_workspace")}
          >
            <Plus aria-hidden />
          </button>
        </div>
        {workspacePrompts.length > 0 ? (
          <div className="prompt-list">
            {workspacePrompts.map((prompt) => renderPromptRow(prompt))}
          </div>
        ) : (
          <div className="prompt-empty-card">
            <ScrollText className="prompt-empty-icon" aria-hidden />
            <div className="prompt-empty-text">
              <div className="prompt-empty-title">
                {t("prompts.empty_workspace_title")}
              </div>
              <div className="prompt-empty-subtitle">
                {t("prompts.empty_workspace_prefix")}
                {workspacePath ? (
                  <button
                    type="button"
                    className="prompt-empty-link"
                    onClick={() => void onRevealWorkspacePrompts()}
                  >
                    {t("prompts.workspace_folder")}
                  </button>
                ) : (
                  <span className="prompt-empty-link is-disabled">
                    {t("prompts.workspace_folder")}
                  </span>
                )}
                {t("prompts.empty_workspace_suffix")}
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="prompt-section">
        <div className="prompt-section-header">
          <div className="prompt-section-title">{t("prompts.section.general")}</div>
          <button
            type="button"
            className="ghost icon-button prompt-section-add"
            onClick={() => startCreate("global")}
            aria-label={t("prompts.add_general")}
            title={t("prompts.add_general")}
          >
            <Plus aria-hidden />
          </button>
        </div>
        {globalPrompts.length > 0 ? (
          <div className="prompt-list">
            {globalPrompts.map((prompt) => renderPromptRow(prompt))}
          </div>
        ) : (
          <div className="prompt-empty-card">
            <ScrollText className="prompt-empty-icon" aria-hidden />
            <div className="prompt-empty-text">
              <div className="prompt-empty-title">
                {t("prompts.empty_general_title")}
              </div>
              <div className="prompt-empty-subtitle">
                {t("prompts.empty_general_prefix")}
                <button
                  type="button"
                  className="prompt-empty-link"
                  onClick={() => void onRevealGeneralPrompts()}
                >
                  {t("prompts.general_folder")}
                </button>
                {t("prompts.empty_general_suffix")}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
