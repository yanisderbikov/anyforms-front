import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');
const serverDir = path.join(distDir, 'server');

// Метаданные страниц живут в одном месте с клиентом (src/App.jsx использует
// тот же модуль), поэтому после гидрации клиент не перезапишет их другими
// значениями.
import {
  SITE_URL,
  PAGE_SEO,
  DEFAULT_OG_IMAGE,
  META_PRERENDER_ROUTES,
} from '../src/shared/pageSeo.mjs';

// dist/index.html — одновременно и главная, и SPA-fallback для всех
// непререндеренных маршрутов (nginx: try_files → /index.html). Чтобы при
// прямом заходе на /chief или /shop не мелькал контент главной, синхронный
// скрипт очищает #root до первой отрисовки, если путь не совпадает.
const ROOT_GUARD =
  '<script>(function(){var p=location.pathname.replace(/\\/+$/,"")||"/";if(p!=="/"){document.getElementById("root").innerHTML="";}})()</script>';

const escapeHtml = (value) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const replaceMeta = (html, route, meta) => {
  const pageUrl = `${SITE_URL}${route}`;
  const title = escapeHtml(meta.title);
  const description = escapeHtml(meta.description);
  const ogImage = meta.image || DEFAULT_OG_IMAGE;

  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(
      /(<meta name="description" content=")[^"]*(")/,
      (_, p1, p2) => `${p1}${description}${p2}`
    )
    .replace(
      /(<meta property="og:title" content=")[^"]*(")/,
      (_, p1, p2) => `${p1}${title}${p2}`
    )
    .replace(
      /(<meta property="og:description" content=")[^"]*(")/,
      (_, p1, p2) => `${p1}${description}${p2}`
    )
    .replace(
      /(<meta property="og:url" content=")[^"]*(")/,
      (_, p1, p2) => `${p1}${pageUrl}${p2}`
    )
    .replace(
      /(<meta property="og:image" content=")[^"]*(")/,
      (_, p1, p2) => `${p1}${ogImage}${p2}`
    )
    .replace(
      /(<meta name="twitter:title" content=")[^"]*(")/,
      (_, p1, p2) => `${p1}${title}${p2}`
    )
    .replace(
      /(<meta name="twitter:description" content=")[^"]*(")/,
      (_, p1, p2) => `${p1}${description}${p2}`
    )
    .replace(
      /(<meta name="twitter:image" content=")[^"]*(")/,
      (_, p1, p2) => `${p1}${ogImage}${p2}`
    )
    .replace(
      /(<link rel="canonical" href=")[^"]*(")/,
      (_, p1, p2) => `${p1}${pageUrl}${p2}`
    );
};

const main = async () => {
  const entryPath = path.join(serverDir, 'entry-server.mjs');
  if (!fs.existsSync(entryPath)) {
    throw new Error(`SSR bundle not found: ${entryPath}. Run "vite build --ssr" first.`);
  }
  const { render, prerenderRoutes } = await import(pathToFileURL(entryPath).href);

  const template = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');

  const writeRoute = (route, html) => {
    const outDir = path.join(distDir, route.replace(/^\//, ''));
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'index.html'), html);
    console.log(`prerendered ${route} -> ${path.relative(distDir, path.join(outDir, 'index.html'))}`);
  };

  for (const route of prerenderRoutes) {
    const meta = PAGE_SEO[route];
    if (!meta) {
      throw new Error(`No PAGE_SEO entry for prerendered route ${route}`);
    }
    const appHtml = render(route);
    let html = replaceMeta(template, route, meta);
    if (!html.includes('<div id="root"></div>')) {
      throw new Error('Template does not contain empty #root container');
    }
    const rootReplacement =
      route === '/'
        ? `<div id="root">${appHtml}</div>${ROOT_GUARD}`
        : `<div id="root">${appHtml}</div>`;
    html = html.replace('<div id="root"></div>', rootReplacement);
    writeRoute(route, html);
  }

  // Страницы без SSR: только правильные мета-теги, #root остаётся пустым —
  // контент рисует клиент. Этого хватает для превью в Telegram и соцсетях.
  for (const route of META_PRERENDER_ROUTES) {
    const meta = PAGE_SEO[route];
    if (!meta) {
      throw new Error(`No PAGE_SEO entry for meta-prerendered route ${route}`);
    }
    if (prerenderRoutes.includes(route)) {
      continue; // уже отрендерен полноценно выше
    }
    writeRoute(route, replaceMeta(template, route, meta));
  }

  // SSR-бандл не нужен в продакшен-образе
  fs.rmSync(serverDir, { recursive: true, force: true });
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
