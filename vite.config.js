import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const base =
  process.env.VITE_BASE != null && process.env.VITE_BASE !== ''
    ? process.env.VITE_BASE.endsWith('/')
      ? process.env.VITE_BASE
      : `${process.env.VITE_BASE}/`
    : '/';

function emitSpa404() {
  let outDir = path.resolve(__dirname, 'dist');
  return {
    name: 'emit-spa-404',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    writeBundle() {
      const templatePath = path.resolve(__dirname, '404.html');
      let html = fs.readFileSync(templatePath, 'utf8');
      html = html.replace("location.replace('/')", `location.replace(${JSON.stringify(base)})`);
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, '404.html'), html);
    },
  };
}

export default defineConfig(({ isSsrBuild }) => ({
  base,
  plugins: [react(), ...(isSsrBuild ? [] : [emitSpa404()])],
  build: isSsrBuild
    ? {
        // package.json без "type": "module", поэтому SSR-бандл выпускается как
        // .mjs — иначе Node в scripts/prerender.mjs прочитает его как CommonJS
        rollupOptions: {
          output: { entryFileNames: 'entry-server.mjs' },
        },
      }
    : {},
  server: {
    port: 3000,
    open: true,
    host: "0.0.0.0",
  },
  optimizeDeps: {
    include: ['date-fns'],
  },
}));
