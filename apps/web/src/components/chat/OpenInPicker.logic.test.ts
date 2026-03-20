import { describe, expect, it } from "vitest";

import {
  CUSTOM_EDITOR_FALLBACK_TYPE,
  CUSTOM_EDITOR_OPTION_VALUE,
  isCustomEditorOption,
  resolveOpenInPickerOptions,
} from "./OpenInPicker.logic";

describe("resolveOpenInPickerOptions", () => {
  it("shows detected editors and always appends custom option when custom path is configured", () => {
    const options = resolveOpenInPickerOptions({
      platform: "Win32",
      availableEditors: ["vscode", "file-manager"],
      hasCustomExecutablePath: true,
    });

    expect(options).toEqual([
      { label: "VS Code", value: "vscode" },
      { label: "Explorer", value: "file-manager" },
      { label: "Custom Editor", value: CUSTOM_EDITOR_OPTION_VALUE },
    ]);
  });

  it("does not include custom option when custom path is empty", () => {
    const options = resolveOpenInPickerOptions({
      platform: "Win32",
      availableEditors: ["file-manager"],
      hasCustomExecutablePath: false,
    });

    expect(options).toEqual([{ label: "Explorer", value: "file-manager" }]);
  });
});

describe("isCustomEditorOption", () => {
  it("returns true for custom editor option value", () => {
    expect(isCustomEditorOption(CUSTOM_EDITOR_OPTION_VALUE)).toBe(true);
  });

  it("returns false for regular editor ids", () => {
    expect(isCustomEditorOption("vscode")).toBe(false);
    expect(isCustomEditorOption("cursor")).toBe(false);
    expect(isCustomEditorOption("file-manager")).toBe(false);
  });
});

describe("CUSTOM_EDITOR_FALLBACK_TYPE", () => {
  it("is vscode for --goto flag support", () => {
    expect(CUSTOM_EDITOR_FALLBACK_TYPE).toBe("vscode");
  });
});
