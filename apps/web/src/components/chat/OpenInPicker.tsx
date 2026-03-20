import { EditorId, type ResolvedKeybindingsConfig } from "@t3tools/contracts";
import { memo, useCallback, useEffect, useMemo } from "react";
import { isOpenFavoriteEditorShortcut, shortcutLabelForCommand } from "../../keybindings";
import { resolveExecutablePathForEditor, usePreferredEditor } from "../../editorPreferences";
import { useAppSettings } from "../../appSettings";
import { ChevronDownIcon, FolderClosedIcon, SettingsIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Group, GroupSeparator } from "../ui/group";
import { Menu, MenuItem, MenuPopup, MenuShortcut, MenuTrigger } from "../ui/menu";
import { AntigravityIcon, CursorIcon, Icon, VisualStudioCode, Zed } from "../Icons";
import { toastManager } from "../ui/toast";
import { readNativeApi } from "~/nativeApi";
import {
  CUSTOM_EDITOR_FALLBACK_TYPE,
  CUSTOM_EDITOR_OPTION_VALUE,
  isCustomEditorOption,
  resolveOpenInPickerOptions,
  type OpenInPickerOptionValue,
} from "./OpenInPicker.logic";

interface EditorOption {
  readonly label: string;
  readonly Icon: Icon;
  readonly value: OpenInPickerOptionValue;
}

const EDITOR_ICON_MAP: ReadonlyMap<EditorId, Icon> = new Map([
  ["cursor", CursorIcon],
  ["vscode", VisualStudioCode],
  ["zed", Zed],
  ["antigravity", AntigravityIcon],
]);

function iconForEditorOption(value: OpenInPickerOptionValue): Icon {
  if (isCustomEditorOption(value)) {
    return SettingsIcon;
  }
  return EDITOR_ICON_MAP.get(value) ?? FolderClosedIcon;
}

function resolveOptions(
  platform: string,
  availableEditors: ReadonlyArray<EditorId>,
  hasCustomExecutablePath: boolean,
): EditorOption[] {
  const options = resolveOpenInPickerOptions({
    platform,
    availableEditors,
    hasCustomExecutablePath,
  });
  return options.map((option) => ({
    label: option.label,
    value: option.value,
    Icon: iconForEditorOption(option.value),
  }));
}

export const OpenInPicker = memo(function OpenInPicker({
  keybindings,
  availableEditors,
  openInCwd,
}: {
  keybindings: ResolvedKeybindingsConfig;
  availableEditors: ReadonlyArray<EditorId>;
  openInCwd: string | null;
}) {
  const { settings, updateSettings } = useAppSettings();
  const [preferredEditor, setPreferredEditor] = usePreferredEditor(availableEditors);
  const hasCustomExecutablePath = settings.preferredEditorExecutablePath.trim().length > 0;
  const useCustomEditor = settings.useCustomEditorPath && hasCustomExecutablePath;

  const options = useMemo(
    () => resolveOptions(navigator.platform, availableEditors, hasCustomExecutablePath),
    [availableEditors, hasCustomExecutablePath],
  );

  // Determine the active option (for icon display on main button)
  const activeOptionValue: OpenInPickerOptionValue = useCustomEditor
    ? CUSTOM_EDITOR_OPTION_VALUE
    : (preferredEditor ?? "file-manager");
  const primaryOption =
    options.find(({ value }) => value === activeOptionValue) ?? options[0] ?? null;

  const openInEditor = useCallback(
    (optionValue: OpenInPickerOptionValue | null) => {
      const api = readNativeApi();
      if (!api || !openInCwd) return;

      const isCustomOption = isCustomEditorOption(optionValue ?? activeOptionValue);

      if (isCustomOption) {
        const customPath = settings.preferredEditorExecutablePath.trim();
        if (!customPath) {
          toastManager.add({
            type: "error",
            title: "No custom editor path",
            description: "Set a custom editor executable path in Settings.",
          });
          return;
        }
        // Use a generic editor type - the server will use the custom path directly
        void api.shell
          .openInEditor(openInCwd, CUSTOM_EDITOR_FALLBACK_TYPE, customPath)
          .catch((error) => {
            toastManager.add({
              type: "error",
              title: "Unable to open editor",
              description: error instanceof Error ? error.message : "Unknown editor launch error.",
            });
          });
        // Persist custom editor as the selected option
        updateSettings({ useCustomEditorPath: true });
      } else {
        const editor = (optionValue as EditorId | null) ?? preferredEditor;
        if (!editor) return;
        const executablePath = resolveExecutablePathForEditor(editor, availableEditors);
        void api.shell.openInEditor(openInCwd, editor, executablePath).catch((error) => {
          toastManager.add({
            type: "error",
            title: "Unable to open editor",
            description: error instanceof Error ? error.message : "Unknown editor launch error.",
          });
        });
        setPreferredEditor(editor);
        // Clear custom editor preference when selecting a detected editor
        if (settings.useCustomEditorPath) {
          updateSettings({ useCustomEditorPath: false });
        }
      }
    },
    [
      activeOptionValue,
      availableEditors,
      openInCwd,
      preferredEditor,
      setPreferredEditor,
      settings,
      updateSettings,
    ],
  );

  const openFavoriteEditorShortcutLabel = useMemo(
    () => shortcutLabelForCommand(keybindings, "editor.openFavorite"),
    [keybindings],
  );

  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      const api = readNativeApi();
      if (!isOpenFavoriteEditorShortcut(e, keybindings)) return;
      if (!api || !openInCwd) return;

      e.preventDefault();

      if (useCustomEditor) {
        const customPath = settings.preferredEditorExecutablePath.trim();
        if (!customPath) return;
        void api.shell
          .openInEditor(openInCwd, CUSTOM_EDITOR_FALLBACK_TYPE, customPath)
          .catch((error) => {
            toastManager.add({
              type: "error",
              title: "Unable to open editor",
              description: error instanceof Error ? error.message : "Unknown editor launch error.",
            });
          });
      } else {
        if (!preferredEditor) return;
        const executablePath = resolveExecutablePathForEditor(preferredEditor, availableEditors);
        void api.shell.openInEditor(openInCwd, preferredEditor, executablePath).catch((error) => {
          toastManager.add({
            type: "error",
            title: "Unable to open editor",
            description: error instanceof Error ? error.message : "Unknown editor launch error.",
          });
        });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    availableEditors,
    keybindings,
    openInCwd,
    preferredEditor,
    settings.preferredEditorExecutablePath,
    useCustomEditor,
  ]);

  const isDisabled = useCustomEditor
    ? !hasCustomExecutablePath || !openInCwd
    : !preferredEditor || !openInCwd;

  return (
    <Group aria-label="Subscription actions">
      <Button
        size="xs"
        variant="outline"
        disabled={isDisabled}
        onClick={() => openInEditor(activeOptionValue)}
      >
        {primaryOption?.Icon && <primaryOption.Icon aria-hidden="true" className="size-3.5" />}
        <span className="sr-only @sm/header-actions:not-sr-only @sm/header-actions:ml-0.5">
          Open
        </span>
      </Button>
      <GroupSeparator className="hidden @sm/header-actions:block" />
      <Menu>
        <MenuTrigger render={<Button aria-label="Copy options" size="icon-xs" variant="outline" />}>
          <ChevronDownIcon aria-hidden="true" className="size-4" />
        </MenuTrigger>
        <MenuPopup align="end">
          {options.length === 0 && <MenuItem disabled>No installed editors found</MenuItem>}
          {options.map(({ label, Icon, value }) => (
            <MenuItem key={value} onClick={() => openInEditor(value)}>
              <Icon aria-hidden="true" className="text-muted-foreground" />
              {label}
              {value === activeOptionValue && openFavoriteEditorShortcutLabel && (
                <MenuShortcut>{openFavoriteEditorShortcutLabel}</MenuShortcut>
              )}
            </MenuItem>
          ))}
        </MenuPopup>
      </Menu>
    </Group>
  );
});
