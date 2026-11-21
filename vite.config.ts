import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { existsSync, readFileSync } from "node:fs";
const outputs = existsSync("amplify_outputs.json") ? JSON.parse(readFileSync("amplify_outputs.json", "utf8")) : {};
export default defineConfig({plugins:[react(),tailwindcss()],define:{__APP_OUTPUTS__:JSON.stringify(outputs)}});
