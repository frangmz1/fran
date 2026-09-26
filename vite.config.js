import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Todo el juego se empaqueta en un solo index.html que se abre con doble clic.
export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
  build: { chunkSizeWarningLimit: 2000 },
});
