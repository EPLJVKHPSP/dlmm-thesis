#!/usr/bin/env node
import { cp, mkdir } from "node:fs/promises";

const copies = [
  [".next/static", ".next/standalone/.next/static"],
  ["public", ".next/standalone/public"],
];

for (const [source, destination] of copies) {
  await mkdir(destination, { recursive: true });
  await cp(source, destination, { recursive: true, force: true });
}

console.log("Prepared the standalone application assets.");
