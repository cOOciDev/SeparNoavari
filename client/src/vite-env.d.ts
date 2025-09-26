/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_IDEA_DEADLINE?: string
  readonly VITE_RESULTS_DATE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
