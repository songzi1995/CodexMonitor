import { useEffect, useMemo, useState } from "react";
import { ask, open } from "@tauri-apps/plugin-dialog";
import {
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  SlidersHorizontal,
  Mic,
  Keyboard,
  Stethoscope,
  TerminalSquare,
  Trash2,
  X,
  FlaskConical,
} from "lucide-react";
import type {
  AppSettings,
  CodexDoctorResult,
  DictationModelStatus,
  WorkspaceGroup,
  WorkspaceInfo,
} from "../../../types";
import { useI18n } from "../../../i18n";
import type { Locale } from "../../../i18n";
import { formatDownloadSize } from "../../../utils/formatting";
import { buildShortcutValue, formatShortcut } from "../../../utils/shortcuts";
import { clampUiScale } from "../../../utils/uiScale";

const DICTATION_MODELS = [
  { id: "tiny", label: "Tiny", size: "75 MB", note: "Fastest, least accurate." },
  { id: "base", label: "Base", size: "142 MB", note: "Balanced default." },
  { id: "small", label: "Small", size: "466 MB", note: "Better accuracy." },
  { id: "medium", label: "Medium", size: "1.5 GB", note: "High accuracy." },
  { id: "large-v3", label: "Large V3", size: "3.0 GB", note: "Best accuracy, heavy download." },
];

type SettingsViewProps = {
  workspaceGroups: WorkspaceGroup[];
  groupedWorkspaces: Array<{
    id: string | null;
    name: string;
    workspaces: WorkspaceInfo[];
  }>;
  ungroupedLabel: string;
  onClose: () => void;
  onMoveWorkspace: (id: string, direction: "up" | "down") => void;
  onDeleteWorkspace: (id: string) => void;
  onCreateWorkspaceGroup: (name: string) => Promise<WorkspaceGroup | null>;
  onRenameWorkspaceGroup: (id: string, name: string) => Promise<boolean | null>;
  onMoveWorkspaceGroup: (id: string, direction: "up" | "down") => Promise<boolean | null>;
  onDeleteWorkspaceGroup: (id: string) => Promise<boolean | null>;
  onAssignWorkspaceGroup: (
    workspaceId: string,
    groupId: string | null,
  ) => Promise<boolean | null>;
  reduceTransparency: boolean;
  onToggleTransparency: (value: boolean) => void;
  appSettings: AppSettings;
  onUpdateAppSettings: (next: AppSettings) => Promise<void>;
  onRunDoctor: (codexBin: string | null) => Promise<CodexDoctorResult>;
  onUpdateWorkspaceCodexBin: (id: string, codexBin: string | null) => Promise<void>;
  scaleShortcutTitle: string;
  scaleShortcutText: string;
  onTestNotificationSound: () => void;
  dictationModelStatus?: DictationModelStatus | null;
  onDownloadDictationModel?: () => void;
  onCancelDictationDownload?: () => void;
  onRemoveDictationModel?: () => void;
  initialSection?: CodexSection;
};

type SettingsSection = "projects" | "display" | "dictation" | "shortcuts";
type CodexSection = SettingsSection | "codex" | "experimental";

export function SettingsView({
  workspaceGroups,
  groupedWorkspaces,
  ungroupedLabel,
  onClose,
  onMoveWorkspace,
  onDeleteWorkspace,
  onCreateWorkspaceGroup,
  onRenameWorkspaceGroup,
  onMoveWorkspaceGroup,
  onDeleteWorkspaceGroup,
  onAssignWorkspaceGroup,
  reduceTransparency,
  onToggleTransparency,
  appSettings,
  onUpdateAppSettings,
  onRunDoctor,
  onUpdateWorkspaceCodexBin,
  scaleShortcutTitle,
  scaleShortcutText,
  onTestNotificationSound,
  dictationModelStatus,
  onDownloadDictationModel,
  onCancelDictationDownload,
  onRemoveDictationModel,
  initialSection,
}: SettingsViewProps) {
  const [activeSection, setActiveSection] = useState<CodexSection>("projects");
  const [codexPathDraft, setCodexPathDraft] = useState(appSettings.codexBin ?? "");
  const [remoteHostDraft, setRemoteHostDraft] = useState(appSettings.remoteBackendHost);
  const [remoteTokenDraft, setRemoteTokenDraft] = useState(appSettings.remoteBackendToken ?? "");
  const [scaleDraft, setScaleDraft] = useState(
    `${Math.round(clampUiScale(appSettings.uiScale) * 100)}%`,
  );
  const [overrideDrafts, setOverrideDrafts] = useState<Record<string, string>>({});
  const [groupDrafts, setGroupDrafts] = useState<Record<string, string>>({});
  const [newGroupName, setNewGroupName] = useState("");
  const [groupError, setGroupError] = useState<string | null>(null);
  const [doctorState, setDoctorState] = useState<{
    status: "idle" | "running" | "done";
    result: CodexDoctorResult | null;
  }>({ status: "idle", result: null });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [shortcutDrafts, setShortcutDrafts] = useState({
    model: appSettings.composerModelShortcut ?? "",
    access: appSettings.composerAccessShortcut ?? "",
    reasoning: appSettings.composerReasoningShortcut ?? "",
  });
  const { t, locale, setLocale } = useI18n();
  const dictationReady = dictationModelStatus?.state === "ready";
  const dictationProgress = dictationModelStatus?.progress ?? null;
  const selectedDictationModel = useMemo(() => {
    return (
      DICTATION_MODELS.find(
        (model) => model.id === appSettings.dictationModelId,
      ) ?? DICTATION_MODELS[1]
    );
  }, [appSettings.dictationModelId]);

  const projects = useMemo(
    () => groupedWorkspaces.flatMap((group) => group.workspaces),
    [groupedWorkspaces],
  );

  useEffect(() => {
    setCodexPathDraft(appSettings.codexBin ?? "");
  }, [appSettings.codexBin]);

  useEffect(() => {
    setRemoteHostDraft(appSettings.remoteBackendHost);
  }, [appSettings.remoteBackendHost]);

  useEffect(() => {
    setRemoteTokenDraft(appSettings.remoteBackendToken ?? "");
  }, [appSettings.remoteBackendToken]);

  useEffect(() => {
    setScaleDraft(`${Math.round(clampUiScale(appSettings.uiScale) * 100)}%`);
  }, [appSettings.uiScale]);

  useEffect(() => {
    setShortcutDrafts({
      model: appSettings.composerModelShortcut ?? "",
      access: appSettings.composerAccessShortcut ?? "",
      reasoning: appSettings.composerReasoningShortcut ?? "",
    });
  }, [
    appSettings.composerAccessShortcut,
    appSettings.composerModelShortcut,
    appSettings.composerReasoningShortcut,
  ]);

  useEffect(() => {
    setOverrideDrafts((prev) => {
      const next: Record<string, string> = {};
      projects.forEach((workspace) => {
        next[workspace.id] =
          prev[workspace.id] ?? workspace.codex_bin ?? "";
      });
      return next;
    });
  }, [projects]);

  useEffect(() => {
    setGroupDrafts((prev) => {
      const next: Record<string, string> = {};
      workspaceGroups.forEach((group) => {
        next[group.id] = prev[group.id] ?? group.name;
      });
      return next;
    });
  }, [workspaceGroups]);

  useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection]);

  const codexDirty =
    (codexPathDraft.trim() || null) !== (appSettings.codexBin ?? null);

  const trimmedScale = scaleDraft.trim();
  const parsedPercent = trimmedScale
    ? Number(trimmedScale.replace("%", ""))
    : Number.NaN;
  const parsedScale = Number.isFinite(parsedPercent) ? parsedPercent / 100 : null;

  const handleSaveCodexSettings = async () => {
    setIsSavingSettings(true);
    try {
      await onUpdateAppSettings({
        ...appSettings,
        codexBin: codexPathDraft.trim() ? codexPathDraft.trim() : null,
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleCommitRemoteHost = async () => {
    const nextHost = remoteHostDraft.trim() || "127.0.0.1:4732";
    setRemoteHostDraft(nextHost);
    if (nextHost === appSettings.remoteBackendHost) {
      return;
    }
    await onUpdateAppSettings({
      ...appSettings,
      remoteBackendHost: nextHost,
    });
  };

  const handleCommitRemoteToken = async () => {
    const nextToken = remoteTokenDraft.trim() ? remoteTokenDraft.trim() : null;
    setRemoteTokenDraft(nextToken ?? "");
    if (nextToken === appSettings.remoteBackendToken) {
      return;
    }
    await onUpdateAppSettings({
      ...appSettings,
      remoteBackendToken: nextToken,
    });
  };

  const handleCommitScale = async () => {
    if (parsedScale === null) {
      setScaleDraft(`${Math.round(clampUiScale(appSettings.uiScale) * 100)}%`);
      return;
    }
    const nextScale = clampUiScale(parsedScale);
    setScaleDraft(`${Math.round(nextScale * 100)}%`);
    if (nextScale === appSettings.uiScale) {
      return;
    }
    await onUpdateAppSettings({
      ...appSettings,
      uiScale: nextScale,
    });
  };

  const handleResetScale = async () => {
    if (appSettings.uiScale === 1) {
      setScaleDraft("100%");
      return;
    }
    setScaleDraft("100%");
    await onUpdateAppSettings({
      ...appSettings,
      uiScale: 1,
    });
  };

  const handleBrowseCodex = async () => {
    const selection = await open({ multiple: false, directory: false });
    if (!selection || Array.isArray(selection)) {
      return;
    }
    setCodexPathDraft(selection);
  };

  const handleRunDoctor = async () => {
    setDoctorState({ status: "running", result: null });
    try {
      const result = await onRunDoctor(
        codexPathDraft.trim() ? codexPathDraft.trim() : null,
      );
      setDoctorState({ status: "done", result });
    } catch (error) {
      setDoctorState({
        status: "done",
        result: {
          ok: false,
          codexBin: codexPathDraft.trim() ? codexPathDraft.trim() : null,
          version: null,
          appServerOk: false,
          details: error instanceof Error ? error.message : String(error),
          path: null,
          nodeOk: false,
          nodeVersion: null,
          nodeDetails: null,
        },
      });
    }
  };

  const updateShortcut = async (
    key: "composerModelShortcut" | "composerAccessShortcut" | "composerReasoningShortcut",
    value: string | null,
  ) => {
    setShortcutDrafts((prev) => ({
      ...prev,
      [key === "composerModelShortcut"
        ? "model"
        : key === "composerAccessShortcut"
          ? "access"
          : "reasoning"]: value ?? "",
    }));
    await onUpdateAppSettings({
      ...appSettings,
      [key]: value,
    });
  };

  const handleShortcutKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
    key: "composerModelShortcut" | "composerAccessShortcut" | "composerReasoningShortcut",
  ) => {
    if (event.key === "Tab") {
      return;
    }
    event.preventDefault();
    if (event.key === "Backspace" || event.key === "Delete") {
      void updateShortcut(key, null);
      return;
    }
    const value = buildShortcutValue(event.nativeEvent);
    if (!value) {
      return;
    }
    void updateShortcut(key, value);
  };

  const trimmedGroupName = newGroupName.trim();
  const canCreateGroup = Boolean(trimmedGroupName);

  const handleCreateGroup = async () => {
    setGroupError(null);
    try {
      const created = await onCreateWorkspaceGroup(newGroupName);
      if (created) {
        setNewGroupName("");
      }
    } catch (error) {
      setGroupError(error instanceof Error ? error.message : String(error));
    }
  };

  const handleRenameGroup = async (group: WorkspaceGroup) => {
    const draft = groupDrafts[group.id] ?? "";
    const trimmed = draft.trim();
    if (!trimmed || trimmed === group.name) {
      setGroupDrafts((prev) => ({
        ...prev,
        [group.id]: group.name,
      }));
      return;
    }
    setGroupError(null);
    try {
      await onRenameWorkspaceGroup(group.id, trimmed);
    } catch (error) {
      setGroupError(error instanceof Error ? error.message : String(error));
      setGroupDrafts((prev) => ({
        ...prev,
        [group.id]: group.name,
      }));
    }
  };

  const updateGroupCopiesFolder = async (
    groupId: string,
    copiesFolder: string | null,
  ) => {
    setGroupError(null);
    try {
      await onUpdateAppSettings({
        ...appSettings,
        workspaceGroups: appSettings.workspaceGroups.map((entry) =>
          entry.id === groupId ? { ...entry, copiesFolder } : entry,
        ),
      });
    } catch (error) {
      setGroupError(error instanceof Error ? error.message : String(error));
    }
  };

  const handleChooseGroupCopiesFolder = async (group: WorkspaceGroup) => {
    const selection = await open({ multiple: false, directory: true });
    if (!selection || Array.isArray(selection)) {
      return;
    }
    await updateGroupCopiesFolder(group.id, selection);
  };

  const handleClearGroupCopiesFolder = async (group: WorkspaceGroup) => {
    if (!group.copiesFolder) {
      return;
    }
    await updateGroupCopiesFolder(group.id, null);
  };

  const handleDeleteGroup = async (group: WorkspaceGroup) => {
    const groupProjects =
      groupedWorkspaces.find((entry) => entry.id === group.id)?.workspaces ?? [];
    const detail =
      groupProjects.length > 0
        ? `\n\nProjects in this group will move to "${ungroupedLabel}".`
        : "";
    const confirmed = await ask(
      `Delete "${group.name}"?${detail}`,
      {
        title: "Delete Group",
        kind: "warning",
        okLabel: "Delete",
        cancelLabel: "Cancel",
      },
    );
    if (!confirmed) {
      return;
    }
    setGroupError(null);
    try {
      await onDeleteWorkspaceGroup(group.id);
    } catch (error) {
      setGroupError(error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <div className="settings-overlay" role="dialog" aria-modal="true">
      <div className="settings-backdrop" onClick={onClose} />
      <div className="settings-window">
        <div className="settings-titlebar">
          <div className="settings-title">{t("settings.title")}</div>
          <button
            type="button"
            className="ghost icon-button settings-close"
            onClick={onClose}
            aria-label={t("settings.close")}
          >
            <X aria-hidden />
          </button>
        </div>
        <div className="settings-body">
          <aside className="settings-sidebar">
            <button
              type="button"
              className={`settings-nav ${activeSection === "projects" ? "active" : ""}`}
              onClick={() => setActiveSection("projects")}
            >
              <LayoutGrid aria-hidden />
              {t("settings.nav.projects")}
            </button>
            <button
              type="button"
              className={`settings-nav ${activeSection === "display" ? "active" : ""}`}
              onClick={() => setActiveSection("display")}
            >
              <SlidersHorizontal aria-hidden />
              {t("settings.nav.display")}
            </button>
            <button
              type="button"
              className={`settings-nav ${activeSection === "dictation" ? "active" : ""}`}
              onClick={() => setActiveSection("dictation")}
            >
              <Mic aria-hidden />
              {t("settings.nav.dictation")}
            </button>
            <button
              type="button"
              className={`settings-nav ${activeSection === "shortcuts" ? "active" : ""}`}
              onClick={() => setActiveSection("shortcuts")}
            >
              <Keyboard aria-hidden />
              {t("settings.nav.shortcuts")}
            </button>
            <button
              type="button"
              className={`settings-nav ${activeSection === "codex" ? "active" : ""}`}
              onClick={() => setActiveSection("codex")}
            >
              <TerminalSquare aria-hidden />
              {t("settings.nav.codex")}
            </button>
            <button
              type="button"
              className={`settings-nav ${activeSection === "experimental" ? "active" : ""}`}
              onClick={() => setActiveSection("experimental")}
            >
              <FlaskConical aria-hidden />
              {t("settings.nav.experimental")}
            </button>
          </aside>
          <div className="settings-content">
            {activeSection === "projects" && (
              <section className="settings-section">
                <div className="settings-section-title">{t("settings.projects.title")}</div>
                <div className="settings-section-subtitle">
                  {t("settings.projects.subtitle")}
                </div>
                <div className="settings-subsection-title">
                  {t("settings.groups.title")}
                </div>
                <div className="settings-subsection-subtitle">
                  {t("settings.groups.subtitle")}
                </div>
                <div className="settings-groups">
                  <div className="settings-group-create">
                    <input
                      className="settings-input settings-input--compact"
                      value={newGroupName}
                      placeholder={t("settings.groups.new_group_placeholder")}
                      onChange={(event) => setNewGroupName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && canCreateGroup) {
                          event.preventDefault();
                          void handleCreateGroup();
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="ghost settings-button-compact"
                      onClick={() => {
                        void handleCreateGroup();
                      }}
                      disabled={!canCreateGroup}
                    >
                      {t("settings.groups.add")}
                    </button>
                  </div>
                  {groupError && <div className="settings-group-error">{groupError}</div>}
                  {workspaceGroups.length > 0 ? (
                    <div className="settings-group-list">
                      {workspaceGroups.map((group, index) => (
                        <div key={group.id} className="settings-group-row">
                          <div className="settings-group-fields">
                            <input
                              className="settings-input settings-input--compact"
                              value={groupDrafts[group.id] ?? group.name}
                              onChange={(event) =>
                                setGroupDrafts((prev) => ({
                                  ...prev,
                                  [group.id]: event.target.value,
                                }))
                              }
                              onBlur={() => {
                                void handleRenameGroup(group);
                              }}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  event.preventDefault();
                                  void handleRenameGroup(group);
                                }
                              }}
                            />
                            <div className="settings-group-copies">
                              <div className="settings-group-copies-label">
                                {t("settings.groups.copies_folder")}
                              </div>
                              <div className="settings-group-copies-row">
                                <div
                                  className={`settings-group-copies-path${
                                    group.copiesFolder ? "" : " empty"
                                  }`}
                                  title={group.copiesFolder ?? ""}
                                >
                                  {group.copiesFolder ??
                                    t("settings.groups.copies_not_set")}
                                </div>
                                <button
                                  type="button"
                                  className="ghost settings-button-compact"
                                  onClick={() => {
                                    void handleChooseGroupCopiesFolder(group);
                                  }}
                                >
                                  {t("settings.groups.choose")}
                                </button>
                                <button
                                  type="button"
                                  className="ghost settings-button-compact"
                                  onClick={() => {
                                    void handleClearGroupCopiesFolder(group);
                                  }}
                                  disabled={!group.copiesFolder}
                                >
                                  {t("common.clear")}
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className="settings-group-actions">
                            <button
                              type="button"
                              className="ghost icon-button"
                              onClick={() => {
                                void onMoveWorkspaceGroup(group.id, "up");
                              }}
                              disabled={index === 0}
                              aria-label={t("settings.groups.move_up")}
                            >
                              <ChevronUp aria-hidden />
                            </button>
                            <button
                              type="button"
                              className="ghost icon-button"
                              onClick={() => {
                                void onMoveWorkspaceGroup(group.id, "down");
                              }}
                              disabled={index === workspaceGroups.length - 1}
                              aria-label={t("settings.groups.move_down")}
                            >
                              <ChevronDown aria-hidden />
                            </button>
                            <button
                              type="button"
                              className="ghost icon-button"
                              onClick={() => {
                                void handleDeleteGroup(group);
                              }}
                              aria-label={t("settings.groups.delete")}
                            >
                              <Trash2 aria-hidden />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="settings-empty">
                      {t("settings.groups.empty")}
                    </div>
                  )}
                </div>
                <div className="settings-subsection-title">
                  {t("settings.projects.list_title")}
                </div>
                <div className="settings-subsection-subtitle">
                  {t("settings.projects.list_subtitle")}
                </div>
                <div className="settings-projects">
                  {groupedWorkspaces.map((group) => (
                    <div key={group.id ?? "ungrouped"} className="settings-project-group">
                      <div className="settings-project-group-label">{group.name}</div>
                      {group.workspaces.map((workspace, index) => {
                        const groupValue =
                          workspaceGroups.some(
                            (entry) => entry.id === workspace.settings.groupId,
                          )
                            ? workspace.settings.groupId ?? ""
                            : "";
                        return (
                          <div key={workspace.id} className="settings-project-row">
                            <div className="settings-project-info">
                              <div className="settings-project-name">{workspace.name}</div>
                              <div className="settings-project-path">{workspace.path}</div>
                            </div>
                            <div className="settings-project-actions">
                              <select
                                className="settings-select settings-select--compact"
                                value={groupValue}
                                onChange={(event) => {
                                  const nextGroupId = event.target.value || null;
                                  void onAssignWorkspaceGroup(
                                    workspace.id,
                                    nextGroupId,
                                  );
                                }}
                              >
                                <option value="">{ungroupedLabel}</option>
                                {workspaceGroups.map((entry) => (
                                  <option key={entry.id} value={entry.id}>
                                    {entry.name}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                className="ghost icon-button"
                                onClick={() => onMoveWorkspace(workspace.id, "up")}
                                disabled={index === 0}
                                aria-label={t("settings.projects.move_up")}
                              >
                                <ChevronUp aria-hidden />
                              </button>
                              <button
                                type="button"
                                className="ghost icon-button"
                                onClick={() => onMoveWorkspace(workspace.id, "down")}
                                disabled={index === group.workspaces.length - 1}
                                aria-label={t("settings.projects.move_down")}
                              >
                                <ChevronDown aria-hidden />
                              </button>
                              <button
                                type="button"
                                className="ghost icon-button"
                                onClick={() => onDeleteWorkspace(workspace.id)}
                                aria-label={t("settings.projects.delete")}
                              >
                                <Trash2 aria-hidden />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                  {projects.length === 0 && (
                    <div className="settings-empty">{t("settings.projects.empty")}</div>
                  )}
                </div>
              </section>
            )}
            {activeSection === "display" && (
              <section className="settings-section">
                <div className="settings-section-title">{t("settings.display.title")}</div>
                <div className="settings-section-subtitle">
                  {t("settings.display.subtitle")}
                </div>
                <div className="settings-subsection-title">
                  {t("settings.display.section.display")}
                </div>
                <div className="settings-subsection-subtitle">
                  {t("settings.display.section.display_subtitle")}
                </div>
                <div className="settings-field">
                  <label className="settings-field-label" htmlFor="theme-select">
                    {t("settings.display.theme")}
                  </label>
                  <select
                    id="theme-select"
                    className="settings-select"
                    value={appSettings.theme}
                    onChange={(event) =>
                      void onUpdateAppSettings({
                        ...appSettings,
                        theme: event.target.value as AppSettings["theme"],
                      })
                    }
                  >
                    <option value="system">{t("settings.display.theme_system")}</option>
                    <option value="light">{t("settings.display.theme_light")}</option>
                    <option value="dark">{t("settings.display.theme_dark")}</option>
                  </select>
                </div>
                <div className="settings-toggle-row">
                  <div>
                    <div className="settings-toggle-title">
                      {t("settings.display.reduce_transparency.title")}
                    </div>
                    <div className="settings-toggle-subtitle">
                      {t("settings.display.reduce_transparency.subtitle")}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`settings-toggle ${reduceTransparency ? "on" : ""}`}
                    onClick={() => onToggleTransparency(!reduceTransparency)}
                    aria-pressed={reduceTransparency}
                  >
                    <span className="settings-toggle-knob" />
                  </button>
                </div>
                <div className="settings-field">
                  <label className="settings-field-label" htmlFor="ui-language">
                    {t("settings.language.label")}
                  </label>
                  <select
                    id="ui-language"
                    className="settings-select"
                    value={locale}
                    onChange={(event) => setLocale(event.target.value as Locale)}
                  >
                    <option value="en">{t("settings.language.option.en")}</option>
                    <option value="zh-CN">{t("settings.language.option.zh")}</option>
                  </select>
                </div>
                <div className="settings-toggle-row settings-scale-row">
                  <div>
                    <div className="settings-toggle-title">
                      {t("settings.display.interface_scale.title")}
                    </div>
                    <div
                      className="settings-toggle-subtitle"
                      title={scaleShortcutTitle}
                    >
                      {scaleShortcutText}
                    </div>
                  </div>
                  <div className="settings-scale-controls">
                    <input
                      id="ui-scale"
                      type="text"
                      inputMode="decimal"
                      className="settings-input settings-input--scale"
                      value={scaleDraft}
                      aria-label={t("settings.display.interface_scale.aria")}
                      onChange={(event) => setScaleDraft(event.target.value)}
                      onBlur={() => {
                        void handleCommitScale();
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void handleCommitScale();
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="ghost settings-scale-reset"
                      onClick={() => {
                        void handleResetScale();
                      }}
                    >
                      {t("settings.display.interface_scale.reset")}
                    </button>
                  </div>
                </div>
                <div className="settings-subsection-title">
                  {t("settings.display.section.sounds")}
                </div>
                <div className="settings-subsection-subtitle">
                  {t("settings.display.section.sounds_subtitle")}
                </div>
                <div className="settings-toggle-row">
                  <div>
                    <div className="settings-toggle-title">
                      {t("settings.display.notification_sounds.title")}
                    </div>
                    <div className="settings-toggle-subtitle">
                      {t("settings.display.notification_sounds.subtitle")}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`settings-toggle ${appSettings.notificationSoundsEnabled ? "on" : ""}`}
                    onClick={() =>
                      void onUpdateAppSettings({
                        ...appSettings,
                        notificationSoundsEnabled: !appSettings.notificationSoundsEnabled,
                      })
                    }
                    aria-pressed={appSettings.notificationSoundsEnabled}
                  >
                    <span className="settings-toggle-knob" />
                  </button>
                </div>
                <div className="settings-sound-actions">
                  <button
                    type="button"
                    className="ghost settings-button-compact"
                    onClick={onTestNotificationSound}
                  >
                    {t("settings.display.notification_sounds.test")}
                  </button>
                </div>
              </section>
            )}
            {activeSection === "dictation" && (
              <section className="settings-section">
                <div className="settings-section-title">{t("settings.dictation.title")}</div>
                <div className="settings-section-subtitle">
                  {t("settings.dictation.subtitle")}
                </div>
                <div className="settings-toggle-row">
                  <div>
                    <div className="settings-toggle-title">
                      {t("settings.dictation.enable.title")}
                    </div>
                    <div className="settings-toggle-subtitle">
                      {t("settings.dictation.enable.subtitle")}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`settings-toggle ${appSettings.dictationEnabled ? "on" : ""}`}
                    onClick={() => {
                      const nextEnabled = !appSettings.dictationEnabled;
                      void onUpdateAppSettings({
                        ...appSettings,
                        dictationEnabled: nextEnabled,
                      });
                      if (
                        !nextEnabled &&
                        dictationModelStatus?.state === "downloading" &&
                        onCancelDictationDownload
                      ) {
                        onCancelDictationDownload();
                      }
                      if (
                        nextEnabled &&
                        dictationModelStatus?.state === "missing" &&
                        onDownloadDictationModel
                      ) {
                        onDownloadDictationModel();
                      }
                    }}
                    aria-pressed={appSettings.dictationEnabled}
                  >
                    <span className="settings-toggle-knob" />
                  </button>
                </div>
                <div className="settings-field">
                  <label className="settings-field-label" htmlFor="dictation-model">
                    {t("settings.dictation.model")}
                  </label>
                  <select
                    id="dictation-model"
                    className="settings-select"
                    value={appSettings.dictationModelId}
                    onChange={(event) =>
                      void onUpdateAppSettings({
                        ...appSettings,
                        dictationModelId: event.target.value,
                      })
                    }
                  >
                    {DICTATION_MODELS.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.label} ({model.size})
                      </option>
                    ))}
                  </select>
                  <div className="settings-help">
                    {t("settings.dictation.model_help", {
                      note: selectedDictationModel.note,
                      size: selectedDictationModel.size,
                    })}
                  </div>
                </div>
                <div className="settings-field">
                  <label className="settings-field-label" htmlFor="dictation-language">
                    {t("settings.dictation.preferred_language")}
                  </label>
                  <select
                    id="dictation-language"
                    className="settings-select"
                    value={appSettings.dictationPreferredLanguage ?? ""}
                    onChange={(event) =>
                      void onUpdateAppSettings({
                        ...appSettings,
                        dictationPreferredLanguage: event.target.value || null,
                      })
                    }
                  >
                    <option value="">{t("settings.dictation.language_options.auto")}</option>
                    <option value="en">{t("settings.dictation.language_options.en")}</option>
                    <option value="es">{t("settings.dictation.language_options.es")}</option>
                    <option value="fr">{t("settings.dictation.language_options.fr")}</option>
                    <option value="de">{t("settings.dictation.language_options.de")}</option>
                    <option value="it">{t("settings.dictation.language_options.it")}</option>
                    <option value="pt">{t("settings.dictation.language_options.pt")}</option>
                    <option value="nl">{t("settings.dictation.language_options.nl")}</option>
                    <option value="sv">{t("settings.dictation.language_options.sv")}</option>
                    <option value="no">{t("settings.dictation.language_options.no")}</option>
                    <option value="da">{t("settings.dictation.language_options.da")}</option>
                    <option value="fi">{t("settings.dictation.language_options.fi")}</option>
                    <option value="pl">{t("settings.dictation.language_options.pl")}</option>
                    <option value="tr">{t("settings.dictation.language_options.tr")}</option>
                    <option value="ru">{t("settings.dictation.language_options.ru")}</option>
                    <option value="uk">{t("settings.dictation.language_options.uk")}</option>
                    <option value="ja">{t("settings.dictation.language_options.ja")}</option>
                    <option value="ko">{t("settings.dictation.language_options.ko")}</option>
                    <option value="zh">{t("settings.dictation.language_options.zh")}</option>
                  </select>
                  <div className="settings-help">
                    {t("settings.dictation.preferred_language_help")}
                  </div>
                </div>
                <div className="settings-field">
                  <label className="settings-field-label" htmlFor="dictation-hold-key">
                    {t("settings.dictation.hold_key")}
                  </label>
                  <select
                    id="dictation-hold-key"
                    className="settings-select"
                    value={appSettings.dictationHoldKey ?? ""}
                    onChange={(event) =>
                      void onUpdateAppSettings({
                        ...appSettings,
                        dictationHoldKey: event.target.value,
                      })
                    }
                  >
                    <option value="">{t("settings.dictation.hold_key_options.off")}</option>
                    <option value="alt">{t("settings.dictation.hold_key_options.alt")}</option>
                    <option value="shift">{t("settings.dictation.hold_key_options.shift")}</option>
                    <option value="control">
                      {t("settings.dictation.hold_key_options.control")}
                    </option>
                    <option value="meta">{t("settings.dictation.hold_key_options.meta")}</option>
                  </select>
                  <div className="settings-help">
                    {t("settings.dictation.hold_key_help")}
                  </div>
                </div>
                {dictationModelStatus && (
                  <div className="settings-field">
                    <div className="settings-field-label">
                      {t("settings.dictation.model_status", {
                        model: selectedDictationModel.label,
                      })}
                    </div>
                    <div className="settings-help">
                      {dictationModelStatus.state === "ready" &&
                        t("settings.dictation.status.ready")}
                      {dictationModelStatus.state === "missing" &&
                        t("settings.dictation.status.missing")}
                      {dictationModelStatus.state === "downloading" &&
                        t("settings.dictation.status.downloading")}
                      {dictationModelStatus.state === "error" &&
                        (dictationModelStatus.error ??
                          t("settings.dictation.status.error"))}
                    </div>
                    {dictationProgress && (
                      <div className="settings-download-progress">
                        <div className="settings-download-bar">
                          <div
                            className="settings-download-fill"
                            style={{
                              width: dictationProgress.totalBytes
                                ? `${Math.min(
                                    100,
                                    (dictationProgress.downloadedBytes /
                                      dictationProgress.totalBytes) *
                                      100,
                                  )}%`
                                : "0%",
                            }}
                          />
                        </div>
                        <div className="settings-download-meta">
                          {formatDownloadSize(dictationProgress.downloadedBytes)}
                        </div>
                      </div>
                    )}
                    <div className="settings-field-actions">
                      {dictationModelStatus.state === "missing" && (
                        <button
                          type="button"
                          className="primary"
                          onClick={onDownloadDictationModel}
                          disabled={!onDownloadDictationModel}
                        >
                          {t("settings.dictation.actions.download")}
                        </button>
                      )}
                      {dictationModelStatus.state === "downloading" && (
                        <button
                          type="button"
                          className="ghost settings-button-compact"
                          onClick={onCancelDictationDownload}
                          disabled={!onCancelDictationDownload}
                        >
                          {t("settings.dictation.actions.cancel")}
                        </button>
                      )}
                      {dictationReady && (
                        <button
                          type="button"
                          className="ghost settings-button-compact"
                          onClick={onRemoveDictationModel}
                          disabled={!onRemoveDictationModel}
                        >
                          {t("settings.dictation.actions.remove")}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </section>
            )}
            {activeSection === "shortcuts" && (
              <section className="settings-section">
                <div className="settings-section-title">{t("settings.shortcuts.title")}</div>
                <div className="settings-section-subtitle">
                  {t("settings.shortcuts.subtitle")}
                </div>
                <div className="settings-field">
                  <div className="settings-field-label">
                    {t("settings.shortcuts.cycle_model")}
                  </div>
                  <div className="settings-field-row">
                    <input
                      className="settings-input settings-input--shortcut"
                      value={formatShortcut(shortcutDrafts.model)}
                      onKeyDown={(event) =>
                        handleShortcutKeyDown(event, "composerModelShortcut")
                      }
                      placeholder={t("settings.shortcuts.input_placeholder")}
                      readOnly
                    />
                    <button
                      type="button"
                      className="ghost settings-button-compact"
                      onClick={() => void updateShortcut("composerModelShortcut", null)}
                    >
                      {t("settings.shortcuts.clear")}
                    </button>
                  </div>
                  <div className="settings-help">
                    {t("settings.shortcuts.shortcut_help", {
                      shortcut: formatShortcut("cmd+shift+m"),
                    })}
                  </div>
                </div>
                <div className="settings-field">
                  <div className="settings-field-label">
                    {t("settings.shortcuts.cycle_access")}
                  </div>
                  <div className="settings-field-row">
                    <input
                      className="settings-input settings-input--shortcut"
                      value={formatShortcut(shortcutDrafts.access)}
                      onKeyDown={(event) =>
                        handleShortcutKeyDown(event, "composerAccessShortcut")
                      }
                      placeholder={t("settings.shortcuts.input_placeholder")}
                      readOnly
                    />
                    <button
                      type="button"
                      className="ghost settings-button-compact"
                      onClick={() => void updateShortcut("composerAccessShortcut", null)}
                    >
                      {t("settings.shortcuts.clear")}
                    </button>
                  </div>
                  <div className="settings-help">
                    {t("settings.shortcuts.shortcut_help_simple", {
                      shortcut: formatShortcut("cmd+shift+a"),
                    })}
                  </div>
                </div>
                <div className="settings-field">
                  <div className="settings-field-label">
                    {t("settings.shortcuts.cycle_reasoning")}
                  </div>
                  <div className="settings-field-row">
                    <input
                      className="settings-input settings-input--shortcut"
                      value={formatShortcut(shortcutDrafts.reasoning)}
                      onKeyDown={(event) =>
                        handleShortcutKeyDown(event, "composerReasoningShortcut")
                      }
                      placeholder={t("settings.shortcuts.input_placeholder")}
                      readOnly
                    />
                    <button
                      type="button"
                      className="ghost settings-button-compact"
                      onClick={() => void updateShortcut("composerReasoningShortcut", null)}
                    >
                      {t("settings.shortcuts.clear")}
                    </button>
                  </div>
                  <div className="settings-help">
                    {t("settings.shortcuts.shortcut_help_simple", {
                      shortcut: formatShortcut("cmd+shift+r"),
                    })}
                  </div>
                </div>
              </section>
            )}
            {activeSection === "codex" && (
              <section className="settings-section">
                <div className="settings-section-title">{t("settings.codex.title")}</div>
                <div className="settings-section-subtitle">
                  {t("settings.codex.subtitle")}
                </div>
                <div className="settings-field">
                  <label className="settings-field-label" htmlFor="codex-path">
                    {t("settings.codex.path")}
                  </label>
                  <div className="settings-field-row">
                    <input
                      id="codex-path"
                      className="settings-input"
                      value={codexPathDraft}
                      placeholder={t("settings.codex.path_placeholder")}
                      onChange={(event) => setCodexPathDraft(event.target.value)}
                    />
                    <button type="button" className="ghost" onClick={handleBrowseCodex}>
                      {t("settings.codex.browse")}
                    </button>
                    <button
                      type="button"
                      className="ghost"
                      onClick={() => setCodexPathDraft("")}
                    >
                      {t("settings.codex.use_path")}
                    </button>
                  </div>
                  <div className="settings-help">
                    {t("settings.codex.path_help")}
                  </div>
                <div className="settings-field-actions">
                  {codexDirty && (
                    <button
                      type="button"
                      className="primary"
                      onClick={handleSaveCodexSettings}
                      disabled={isSavingSettings}
                    >
                      {isSavingSettings
                        ? t("settings.codex.saving")
                        : t("settings.codex.save")}
                    </button>
                  )}
                  <button
                    type="button"
                    className="ghost settings-button-compact"
                    onClick={handleRunDoctor}
                    disabled={doctorState.status === "running"}
                  >
                    <Stethoscope aria-hidden />
                    {doctorState.status === "running"
                      ? t("settings.codex.running")
                      : t("settings.codex.run_doctor")}
                  </button>
                </div>

                {doctorState.result && (
                  <div
                    className={`settings-doctor ${doctorState.result.ok ? "ok" : "error"}`}
                  >
                    <div className="settings-doctor-title">
                      {doctorState.result.ok
                        ? t("settings.codex.doctor_ok")
                        : t("settings.codex.doctor_error")}
                    </div>
                    <div className="settings-doctor-body">
                      <div>
                        {t("settings.codex.doctor_version", {
                          version: doctorState.result.version ?? "unknown",
                        })}
                      </div>
                      <div>
                        {t("settings.codex.doctor_app_server", {
                          status: doctorState.result.appServerOk ? "ok" : "failed",
                        })}
                      </div>
                      <div>
                        {t("settings.codex.doctor_node", {
                          status: doctorState.result.nodeOk
                            ? `ok (${doctorState.result.nodeVersion ?? "unknown"})`
                            : "missing",
                        })}
                      </div>
                      {doctorState.result.details && (
                        <div>{doctorState.result.details}</div>
                      )}
                      {doctorState.result.nodeDetails && (
                        <div>{doctorState.result.nodeDetails}</div>
                      )}
                      {doctorState.result.path && (
                        <div className="settings-doctor-path">
                          {t("settings.codex.path_prefix")} {doctorState.result.path}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

                <div className="settings-field">
                  <label className="settings-field-label" htmlFor="default-access">
                    {t("settings.codex.access_mode")}
                  </label>
                  <select
                    id="default-access"
                    className="settings-select"
                    value={appSettings.defaultAccessMode}
                    onChange={(event) =>
                      void onUpdateAppSettings({
                        ...appSettings,
                        defaultAccessMode: event.target.value as AppSettings["defaultAccessMode"],
                      })
                    }
                  >
                    <option value="read-only">
                      {t("settings.codex.access_mode_options.read-only")}
                    </option>
                    <option value="current">
                      {t("settings.codex.access_mode_options.current")}
                    </option>
                    <option value="full-access">
                      {t("settings.codex.access_mode_options.full-access")}
                    </option>
                  </select>
                </div>

                <div className="settings-field">
                  <label className="settings-field-label" htmlFor="backend-mode">
                    {t("settings.codex.backend_mode")}
                  </label>
                  <select
                    id="backend-mode"
                    className="settings-select"
                    value={appSettings.backendMode}
                    onChange={(event) =>
                      void onUpdateAppSettings({
                        ...appSettings,
                        backendMode: event.target.value as AppSettings["backendMode"],
                      })
                    }
                  >
                    <option value="local">
                      {t("settings.codex.backend_mode_options.local")}
                    </option>
                    <option value="remote">
                      {t("settings.codex.backend_mode_options.remote")}
                    </option>
                  </select>
                  <div className="settings-help">
                    {t("settings.codex.backend_mode_help")}
                  </div>
                </div>

                {appSettings.backendMode === "remote" && (
                  <div className="settings-field">
                    <div className="settings-field-label">
                      {t("settings.codex.remote_backend")}
                    </div>
                    <div className="settings-field-row">
                      <input
                        className="settings-input settings-input--compact"
                        value={remoteHostDraft}
                        placeholder="127.0.0.1:4732"
                        onChange={(event) => setRemoteHostDraft(event.target.value)}
                        onBlur={() => {
                          void handleCommitRemoteHost();
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            void handleCommitRemoteHost();
                          }
                        }}
                        aria-label={t("settings.codex.remote_host_aria")}
                      />
                      <input
                        type="password"
                        className="settings-input settings-input--compact"
                        value={remoteTokenDraft}
                        placeholder={t("settings.codex.remote_token_placeholder")}
                        onChange={(event) => setRemoteTokenDraft(event.target.value)}
                        onBlur={() => {
                          void handleCommitRemoteToken();
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            void handleCommitRemoteToken();
                          }
                        }}
                        aria-label={t("settings.codex.remote_token_aria")}
                      />
                    </div>
                    <div className="settings-help">
                      {t("settings.codex.remote_help")}
                    </div>
                  </div>
                )}

                <div className="settings-field">
                  <div className="settings-field-label">
                    {t("settings.codex.workspace_overrides")}
                  </div>
                  <div className="settings-overrides">
                    {projects.map((workspace) => (
                      <div key={workspace.id} className="settings-override-row">
                        <div className="settings-override-info">
                          <div className="settings-project-name">{workspace.name}</div>
                          <div className="settings-project-path">{workspace.path}</div>
                        </div>
                        <div className="settings-override-actions">
                          <input
                            className="settings-input settings-input--compact"
                            value={overrideDrafts[workspace.id] ?? ""}
                            placeholder={t("settings.codex.override_placeholder")}
                            onChange={(event) =>
                              setOverrideDrafts((prev) => ({
                                ...prev,
                                [workspace.id]: event.target.value,
                              }))
                            }
                            onBlur={async () => {
                              const draft = overrideDrafts[workspace.id] ?? "";
                              const nextValue = draft.trim() || null;
                              if (nextValue === (workspace.codex_bin ?? null)) {
                                return;
                              }
                              await onUpdateWorkspaceCodexBin(workspace.id, nextValue);
                            }}
                          />
                          <button
                            type="button"
                            className="ghost"
                            onClick={async () => {
                              setOverrideDrafts((prev) => ({
                                ...prev,
                                [workspace.id]: "",
                              }));
                              await onUpdateWorkspaceCodexBin(workspace.id, null);
                            }}
                          >
                            {t("common.clear")}
                          </button>
                        </div>
                      </div>
                    ))}
                    {projects.length === 0 && (
                      <div className="settings-empty">
                        {t("settings.codex.overrides_empty")}
                      </div>
                    )}
                  </div>
                </div>

              </section>
            )}
            {activeSection === "experimental" && (
              <section className="settings-section">
                <div className="settings-section-title">
                  {t("settings.experimental.title")}
                </div>
                <div className="settings-section-subtitle">
                  {t("settings.experimental.subtitle")}
                </div>
                <div className="settings-toggle-row">
                  <div>
                    <div className="settings-toggle-title">
                      {t("settings.experimental.collab.title")}
                    </div>
                    <div className="settings-toggle-subtitle">
                      {t("settings.experimental.collab.subtitle")}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`settings-toggle ${appSettings.experimentalCollabEnabled ? "on" : ""}`}
                    onClick={() =>
                      void onUpdateAppSettings({
                        ...appSettings,
                        experimentalCollabEnabled: !appSettings.experimentalCollabEnabled,
                      })
                    }
                    aria-pressed={appSettings.experimentalCollabEnabled}
                  >
                    <span className="settings-toggle-knob" />
                  </button>
                </div>
                <div className="settings-toggle-row">
                  <div>
                    <div className="settings-toggle-title">
                      {t("settings.experimental.unified_exec.title")}
                    </div>
                    <div className="settings-toggle-subtitle">
                      {t("settings.experimental.unified_exec.subtitle")}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`settings-toggle ${appSettings.experimentalUnifiedExecEnabled ? "on" : ""}`}
                    onClick={() =>
                      void onUpdateAppSettings({
                        ...appSettings,
                        experimentalUnifiedExecEnabled: !appSettings.experimentalUnifiedExecEnabled,
                      })
                    }
                    aria-pressed={appSettings.experimentalUnifiedExecEnabled}
                  >
                    <span className="settings-toggle-knob" />
                  </button>
                </div>
                <div className="settings-toggle-row">
                  <div>
                    <div className="settings-toggle-title">
                      {t("settings.experimental.steer.title")}
                    </div>
                    <div className="settings-toggle-subtitle">
                      {t("settings.experimental.steer.subtitle")}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`settings-toggle ${appSettings.experimentalSteerEnabled ? "on" : ""}`}
                    onClick={() =>
                      void onUpdateAppSettings({
                        ...appSettings,
                        experimentalSteerEnabled: !appSettings.experimentalSteerEnabled,
                      })
                    }
                    aria-pressed={appSettings.experimentalSteerEnabled}
                  >
                    <span className="settings-toggle-knob" />
                  </button>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
