import { describe, expect, it } from "vitest";

import { hasDeveloperIdApplicationAuthority } from "./macCodeSigning";

describe("hasDeveloperIdApplicationAuthority", () => {
  it("matches a Developer ID Application authority line", () => {
    expect(
      hasDeveloperIdApplicationAuthority(`Executable=/Applications/V3 Copilot.app/Contents/MacOS/V3 Copilot
Identifier=com.t3tools.t3code
Format=app bundle with Mach-O thin (x86_64)
Authority=Developer ID Application: T3 Tools, Inc. (ABCDE12345)
Authority=Developer ID Certification Authority
Authority=Apple Root CA`),
    ).toBe(true);
  });

  it("ignores ad hoc signatures and unsigned output", () => {
    expect(
      hasDeveloperIdApplicationAuthority(`Executable=/Applications/T3 Code.app/Contents/MacOS/T3 Code
Signature=adhoc`),
    ).toBe(false);
    expect(hasDeveloperIdApplicationAuthority("code object is not signed at all")).toBe(false);
  });
});
