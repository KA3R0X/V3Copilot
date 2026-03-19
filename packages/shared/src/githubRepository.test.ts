import { describe, expect, it } from "vitest";

import {
  DEFAULT_GITHUB_REPOSITORY,
  formatGitHubRepository,
  parseGitHubRepository,
} from "./githubRepository";

describe("parseGitHubRepository", () => {
  it("parses valid owner/repo slugs", () => {
    expect(parseGitHubRepository("KA3R0X/V3Copilot")).toEqual({
      owner: "KA3R0X",
      repo: "V3Copilot",
    });
  });

  it("rejects invalid repository slugs", () => {
    expect(parseGitHubRepository("")).toBeNull();
    expect(parseGitHubRepository("KA3R0X")).toBeNull();
    expect(parseGitHubRepository("KA3R0X/V3Copilot/releases")).toBeNull();
    expect(parseGitHubRepository("KA3R0X /V3Copilot")).toBeNull();
  });
});

describe("formatGitHubRepository", () => {
  it("round-trips the default repository slug", () => {
    const repository = parseGitHubRepository(DEFAULT_GITHUB_REPOSITORY);
    expect(repository).not.toBeNull();
    expect(formatGitHubRepository(repository!)).toBe(DEFAULT_GITHUB_REPOSITORY);
  });
});
