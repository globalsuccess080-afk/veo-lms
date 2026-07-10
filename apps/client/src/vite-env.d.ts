/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_ASSET_BASE_URL: string
  readonly VITE_VIDEO_ASSET_BASE_URL: string
  readonly VITE_RAZORPAY_KEY_ID: string
  readonly VITE_APP_NAME: string
  readonly VITE_WS_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
