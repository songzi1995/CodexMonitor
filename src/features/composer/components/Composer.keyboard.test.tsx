// @vitest-environment jsdom
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { I18nProvider } from "../../../i18n/I18nProvider";
import { Composer } from "./Composer";

const baseProps = {
  onSend: vi.fn(),
  onQueue: vi.fn(),
  onStop: vi.fn(),
  canStop: false,
  disabled: false,
  isProcessing: false,
  steerEnabled: false,
  collaborationModes: [],
  selectedCollaborationModeId: null,
  onSelectCollaborationMode: vi.fn(),
  models: [],
  selectedModelId: null,
  onSelectModel: vi.fn(),
  reasoningOptions: [],
  selectedEffort: null,
  onSelectEffort: vi.fn(),
  accessMode: "current" as const,
  onSelectAccessMode: vi.fn(),
  skills: [],
  prompts: [],
  files: [],
};

function renderComposer(overrides: Partial<typeof baseProps> = {}) {
  const props = { ...baseProps, ...overrides };
  return render(
    <I18nProvider>
      <Composer {...props} draftText="Hello" />
    </I18nProvider>,
  );
}

function getTextarea(container: HTMLElement) {
  const textarea = container.querySelector("textarea");
  if (!textarea) {
    throw new Error("Textarea not found");
  }
  return textarea;
}

describe("Composer keyboard send", () => {
  it("sends only on Cmd+Enter", () => {
    const onSend = vi.fn();
    const { container } = renderComposer({ onSend });
    const textarea = getTextarea(container);

    fireEvent.keyDown(textarea, { key: "Enter" });
    expect(onSend).not.toHaveBeenCalled();

    fireEvent.keyDown(textarea, { key: "Enter", metaKey: true });
    expect(onSend).toHaveBeenCalledTimes(1);
  });
});
