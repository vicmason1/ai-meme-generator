interface ImportMetaEnv {
  readonly VITE_API_KEY: string
  // Diğer VITE_ değişkenleri buraya eklenebilir
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
