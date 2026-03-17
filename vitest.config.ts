import { defineConfig } from "vitest/config"
import { resolve } from "path"
import { fileURLToPath } from "url"

const __dirname = fileURLToPath(new URL(".", import.meta.url))

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/__tests__/setup.ts"]
  },
  resolve: {
    alias: {
      "~background": resolve(__dirname, "./src/background"),
      "~components": resolve(__dirname, "./src/components"),
      "~lib": resolve(__dirname, "./src/lib"),
      "~contents": resolve(__dirname, "./src/contents"),
      "~styles": resolve(__dirname, "./src/styles")
    }
  }
})
