import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(fileURLToPath(new URL("../", import.meta.url)));
