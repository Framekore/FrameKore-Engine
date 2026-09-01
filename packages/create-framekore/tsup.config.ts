import { defineConfig } from "tsup";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  clean: true,
  minify: true,
  banner: {
    js: "#!/usr/bin/env node",
  },
  async onSuccess() {
    const srcDir = path.resolve(__dirname, "templates");
    const destDir = path.resolve(__dirname, "dist/templates");

    try {
      await fs.cp(srcDir, destDir, { recursive: true });
      console.log("Templates copiados para dist/templates com sucesso!");
    } catch (err) {
      console.error("Erro ao copiar templates:", err);
    }
  },
});