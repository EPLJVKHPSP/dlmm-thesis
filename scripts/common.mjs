import { resolve } from "node:path";

export function argValue(name) {
  const prefix = `--${name}=`;
  return process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length) ?? null;
}

export function artifactVersion() {
  return "v1.1.0";
}

export function pathFromArgument(name, fallback) {
  return resolve(argValue(name) ?? fallback);
}
