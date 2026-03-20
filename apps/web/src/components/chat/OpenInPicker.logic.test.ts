import { describe, expect, it } from "vitest";

import {
  CUSTOM_EDITOR_FALLBACK_TYPE,
  CUSTOM_EDITOR_OPTION_VALUE,
  isCustomEditorOption,
  resolveCustomEditorPreferenceForPathEdit,
  resolveCustomEditorPreferenceForSelection,
  resolveOpenInPickerOptions,
  resolveUseCustomEditor,
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

describe("resolveUseCustomEditor", () => {
  it("returns true when useCustomEditorPath is true", () => {
    expect(
      resolveUseCustomEditor({
        hasCustomExecutablePath: true,
        preference: {
          useCustomEditorPath: true,
          useCustomEditorPathTouched: true,
        },
      }),
    ).toBe(true);
  });

  it("returns false when useCustomEditorPath is false", () => {
    expect(
      resolveUseCustomEditor({
        hasCustomExecutablePath: true,
        preference: {
          useCustomEditorPath: false,
          useCustomEditorPathTouched: true,
        },
      }),
    ).toBe(false);
  });

  it("disables custom when no path exists", () => {
    expect(
      resolveUseCustomEditor({
        hasCustomExecutablePath: false,
        preference: {
          useCustomEditorPath: true,
          useCustomEditorPathTouched: true,
        },
      }),
    ).toBe(false);
  });
});

describe("custom editor preference transitions", () => {
  it("marks custom selection as explicit", () => {
    expect(resolveCustomEditorPreferenceForSelection(CUSTOM_EDITOR_OPTION_VALUE)).toEqual({
      useCustomEditorPath: true,
      useCustomEditorPathTouched: true,
    });
  });

  it("marks regular editor selection as explicit non-custom", () => {
    expect(resolveCustomEditorPreferenceForSelection("vscode")).toEqual({
      useCustomEditorPath: false,
      useCustomEditorPathTouched: true,
    });
  });

  it("sets path as custom explicitly on path edits", () => {
    expect(resolveCustomEditorPreferenceForPathEdit()).toEqual({
      useCustomEditorPath: true,
      useCustomEditorPathTouched: true,
    });
  });
});
