import { defineConfig } from 'vite';

const GITHUB_PAGES_BASE_PATH = '/reading-progress-engine/';

export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? GITHUB_PAGES_BASE_PATH : '/',
});
