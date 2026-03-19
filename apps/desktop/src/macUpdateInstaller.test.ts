import * as FS from "node:fs";
import * as OS from "node:os";
import * as Path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  buildMacManualUpdateInstallScript,
  findFirstAppBundlePath,
  resolveDownloadedMacUpdateZipPath,
} from "./macUpdateInstaller";

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    FS.rmSync(dir, { recursive: true, force: true });
  }
});

describe("resolveDownloadedMacUpdateZipPath", () => {
  it("returns the downloaded zip path", () => {
    expect(resolveDownloadedMacUpdateZipPath(["/tmp/update.zip", "/tmp/update.blockmap"])).toBe(
      "/tmp/update.zip",
    );
  });

  it("returns null when no zip exists", () => {
    expect(resolveDownloadedMacUpdateZipPath(["/tmp/update.blockmap"])).toBeNull();
  });
});

describe("findFirstAppBundlePath", () => {
  it("finds an extracted app bundle recursively", async () => {
    const rootDir = FS.mkdtempSync(Path.join(OS.tmpdir(), "t3-mac-update-"));
    tempDirs.push(rootDir);

    const appPath = Path.join(rootDir, "nested", "V3 Copilot.app");
    await FS.promises.mkdir(appPath, { recursive: true });
import * as FS from "node:fs";
import * as OS from "node:os";
import * as Path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  buildMacManualUpdateInstallScript,
  findFirstAppBundlePath,
  resolveDownloadedMacUpdateZipPath,
} from "./macUpdateInstaller";

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    FS.rmSync(dir, { recursive: true, force: true });
  }
});

describe("resolveDownloadedMacUpdateZipPath", () => {
  it("returns the downloaded zip path", () => {
    expect(resolveDownloadedMacUpdateZipPath(["/tmp/update.zip", "/tmp/update.blockmap"])).toBe(
      "/tmp/update.zip",
    );
  });

  it("returns null when no zip exists", () => {
    expect(resolveDownloadedMacUpdateZipPath(["/tmp/update.blockmap"])).toBeNull();
  });
});

describe("findFirstAppBundlePath", () => {
  it("finds an extracted app bundle recursively", async () => {
    const rootDir = FS.mkdtempSync(Path.join(OS.tmpdir(), "t3-mac-update-"));
    tempDirs.push(rootDir);

    const appPath = Path.join(rootDir, "nested", "V3 Copilot.app");
    await FS.promises.mkdir(appPath, { recursive: true });

    expect(findFirstAppBundlePath(rootDir)).toBe(appPath);
  });
});

describe("buildMacManualUpdateInstallScript", () => {
  it("builds a detached installer script with admin fallback", () => {
    const script = buildMacManualUpdateInstallScript({
      appPid: 123,
      sourceAppPath: "/tmp/V3 Copilot's Update.app",
      targetAppPath: "/Applications/V3 Copilot.app",
      stagingDir: "/tmp/t3-stage",
    });

    expect(script).toContain("APP_PID=123");
    expect(script).toContain("wait_for_app_exit");
    expect(script).toContain("/usr/bin/ditto");
    expect(script).toContain("/usr/bin/osascript");
    expect(script).toContain(`SOURCE_APP='/tmp/V3 Copilot'\\''s Update.app'`);
    expect(script).toContain(`TARGET_APP='/Applications/V3 Copilot.app'`);
    expect(script).toContain('/usr/bin/open -n "$TARGET_APP"');
  });
});
