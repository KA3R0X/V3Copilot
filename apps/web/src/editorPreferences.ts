import { EDITORS, EditorId, NativeApi } from "@t3tools/contracts";
import { useCallback, useEffect, useMemo } from "react";
import { getLocalStorageItem, setLocalStorageItem, useLocalStorage } from "./hooks/useLocalStorage";
import { getAppSettingsSnapshot, updateAppSettings, useAppSettings } from "./appSettings";

const LAST_EDITOR_KEY = "t3code:last-editor";

export interface ResolvedPreferredEditor {
  readonly editor: EditorId | null;
  readonly executablePath: string | null;
}

function normalizeExecutablePath(path: string): string | null {
  const trimmed = path.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function resolveFallbackEditor(availableEditorIds: ReadonlySet<EditorId>): EditorId | null {
  return EDITORS.find((editor) => availableEditorIds.has(editor.id))?.id ?? null;
}

function persistLegacyEditor(editor: EditorId): void {
  setLocalStorageItem(LAST_EDITOR_KEY, editor, EditorId);
}

function resolvePreferredEditorLaunch(input: {
  readonly preferredEditor: EditorId | null;
  readonly preferredEditorExecutablePath: string;
  readonly availableEditors: readonly EditorId[];
  readonly legacyStoredEditor: EditorId | null;
}): ResolvedPreferredEditor {
  const availableEditorIds = new Set(input.availableEditors);
  const executablePath = normalizeExecutablePath(input.preferredEditorExecutablePath);

  if (input.preferredEditor !== null) {
    if (executablePath) {
      return { editor: input.preferredEditor, executablePath };
    }
    if (availableEditorIds.has(input.preferredEditor)) {
      return { editor: input.preferredEditor, executablePath: null };
    }
  } else if (input.legacyStoredEditor && availableEditorIds.has(input.legacyStoredEditor)) {
    return { editor: input.legacyStoredEditor, executablePath: null };
  }

  const fallbackEditor = resolveFallbackEditor(availableEditorIds);
  if (fallbackEditor) {
    return { editor: fallbackEditor, executablePath: executablePath };
  }
  return { editor: null, executablePath: executablePath };
}

export function resolveAndPersistPreferredEditorLaunch(
  availableEditors: readonly EditorId[],
): ResolvedPreferredEditor {
  const settings = getAppSettingsSnapshot();
  const legacyStoredEditor = getLocalStorageItem(LAST_EDITOR_KEY, EditorId);
  const resolved = resolvePreferredEditorLaunch({
    preferredEditor: settings.preferredEditor,
    preferredEditorExecutablePath: settings.preferredEditorExecutablePath,
    availableEditors,
    legacyStoredEditor,
  });
  if (resolved.editor) {
    persistLegacyEditor(resolved.editor);
    if (
      resolved.executablePath === null &&
      settings.preferredEditor === null &&
      legacyStoredEditor === resolved.editor
    ) {
      updateAppSettings({ preferredEditor: resolved.editor });
    }
  }
  return resolved;
}

export function resolveExecutablePathForEditor(
  _editor: EditorId,
  _availableEditors: readonly EditorId[],
): string | undefined {
  const settings = getAppSettingsSnapshot();
  const customPath = normalizeExecutablePath(settings.preferredEditorExecutablePath);
  if (customPath) {
    return customPath;
  }
  return undefined;
}

export function usePreferredEditor(availableEditors: ReadonlyArray<EditorId>) {
  const { settings, updateSettings } = useAppSettings();
  const [legacyStoredEditor] = useLocalStorage(LAST_EDITOR_KEY, null, EditorId);

  const resolved = useMemo(
    () =>
      resolvePreferredEditorLaunch({
        preferredEditor: settings.preferredEditor,
        preferredEditorExecutablePath: settings.preferredEditorExecutablePath,
        availableEditors,
        legacyStoredEditor,
      }),
    [
      availableEditors,
      legacyStoredEditor,
      settings.preferredEditor,
      settings.preferredEditorExecutablePath,
    ],
  );

  useEffect(() => {
    if (!resolved.editor) {
      return;
    }
    persistLegacyEditor(resolved.editor);
    if (
      resolved.executablePath === null &&
      settings.preferredEditor === null &&
      legacyStoredEditor === resolved.editor
    ) {
      updateSettings({ preferredEditor: resolved.editor });
    }
  }, [
    legacyStoredEditor,
    resolved.editor,
    resolved.executablePath,
    settings.preferredEditor,
    updateSettings,
  ]);

  const setPreferredEditor = useCallback(
    (editor: EditorId | null) => {
      updateSettings({ preferredEditor: editor });
      if (editor) {
        persistLegacyEditor(editor);
      }
    },
    [updateSettings],
  );

  return [resolved.editor, setPreferredEditor] as const;
}

export function resolveAndPersistPreferredEditor(
  availableEditors: readonly EditorId[],
): EditorId | null {
  return resolveAndPersistPreferredEditorLaunch(availableEditors).editor;
}

export async function openInPreferredEditor(api: NativeApi, targetPath: string): Promise<EditorId> {
  const { availableEditors } = await api.server.getConfig();
  const { editor, executablePath } = resolveAndPersistPreferredEditorLaunch(availableEditors);
  if (!editor) throw new Error("No available editors found.");
  await api.shell.openInEditor(targetPath, editor, executablePath ?? undefined);
  return editor;
}
