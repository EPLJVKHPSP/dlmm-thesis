import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

export function argValue(name) {
  const prefix = `--${name}=`;
  return process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length) ?? null;
}

export function codeRevision() {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  } catch {
    return "uncommitted-public-artifact";
  }
}

export function pathFromArgument(name, fallback) {
  return resolve(argValue(name) ?? fallback);
}
