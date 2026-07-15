import { resolve } from "node:path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";
import external from "vite-plugin-external";

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        output: {
          exports: "named",
          preserveModules: true,
          preserveModulesRoot: "src/main"
        }
      },
      lib: {
        entry: resolve(__dirname, "src/main/index.ts"),
        formats: ["cjs"]
      },
      sourcemap: true
    }
    ,
    plugins: [
      externalizeDepsPlugin({
        include: ["@freelensapp/extensions"]
      }),
      external({
        externals: {
          "@freelensapp/extensions": "global.LensExtensions"
        }
      })
    ]
  },
  preload: {
    plugins: [
      react({
        jsxRuntime: "classic"
      }),
      externalizeDepsPlugin({
        include: [
          "@freelensapp/extensions",
          "electron",
          "react",
          "react-dom",
          "mobx",
          "mobx-react",
          "react-router-dom"
        ]
      }),
      external({
        externals: {
          "@freelensapp/extensions": "global.LensExtensions",
          react: "global.React",
          "react-dom": "global.ReactDom",
          mobx: "global.Mobx",
          "mobx-react": "global.MobxReact",
          "react-router-dom": "global.ReactRouterDom"
        }
      })
    ],
    build: {
      outDir: "out/renderer",
      lib: {
        entry: resolve(__dirname, "src/renderer/index.tsx"),
        formats: ["cjs"]
      },
      rollupOptions: {
        output: {
          exports: "named",
          preserveModules: true,
          preserveModulesRoot: "src/renderer"
        }
      },
      sourcemap: true
    }
  }
});
