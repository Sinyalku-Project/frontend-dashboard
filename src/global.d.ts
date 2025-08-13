// src/global.d.ts
declare module '*.css';
declare module '*.scss';
declare module '*.png';
declare module '*.jpg';

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  // add more env vars here if needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}