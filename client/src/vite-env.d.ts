/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_API_TIMEOUT: string
  readonly VITE_OPENAI_API_KEY?: string
  readonly VITE_APP_NAME: string
  readonly VITE_MAX_FILE_SIZE: string
  readonly VITE_SUPPORTED_FORMATS: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
