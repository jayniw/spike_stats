// Carga variables de un archivo .env estilo dotenv SIN dependencias externas.
// tsx y Vitest no cargan .env.local automáticamente; Next.js sí, por eso la app
// no necesita esto. Las entradas existentes en process.env NUNCA se sobreescriben.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export function loadEnvFile(paths: string[], baseDir: string = process.cwd()): void {
  for (const path of paths) {
    let contents: string;
    try {
      contents = readFileSync(resolve(baseDir, path), "utf8");
    } catch {
      continue;
    }
    for (const rawLine of contents.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const withoutExport = line.startsWith("export ") ? line.slice(7).trim() : line;
      const separatorIndex = withoutExport.indexOf("=");
      if (separatorIndex <= 0) continue;
      const key = withoutExport.slice(0, separatorIndex).trim();
      const value = withoutExport.slice(separatorIndex + 1).trim();
      const unquoted = value.replace(/^(['"])(.*)\1$/, "$2");
      if (!(key in process.env)) {
        process.env[key] = unquoted;
      }
    }
  }
}
