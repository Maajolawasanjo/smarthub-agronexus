import { defineConfig } from "vitest/config";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
