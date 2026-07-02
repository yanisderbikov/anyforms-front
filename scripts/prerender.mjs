import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');
const serverDir = path.join(distDir, 'server');

const SITE_URL = 'https://anyforms.ru';

// Метаданные маршрутов, которые пререндерятся в статический HTML.
// Должны совпадать с PAGE_SEO в src/App.jsx, чтобы клиент не перезаписывал
// их другими значениями после гидрации.
const ROUTE_META = {
  '/': {
    title: 'Силиконовые формы под заказ',
    description:
      'Силиконовые формы на заказ: рестораны, кондитерские, свечевары и производство. Подберём форму и рассчитаем под вашу задачу.',
    ogImage: `${SITE_URL}/anyforms-logo.svg`,
  },
  '/3d-print': {
    title: 'Корпуса для электроники на заказ — 3D-печать от 1 шт | anyforms',
    description:
      'Изготовим корпус для вашей электроники без пресс-формы: от образца за 3–7 рабочих дней до серии в тысячи штук. PETG, ABS GF, PA12. Расчёт за 15 минут.',
    ogImage: `${SITE_URL}/og-3d-print.png`,
  },
};

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
      (_, p1, p2) => `${p1}${meta.ogImage}${p2}`
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
      (_, p1, p2) => `${p1}${meta.ogImage}${p2}`
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

  for (const route of prerenderRoutes) {
    const meta = ROUTE_META[route];
    if (!meta) {
      throw new Error(`No ROUTE_META for prerendered route ${route}`);
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

    const outDir = path.join(distDir, route.replace(/^\//, ''));
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'index.html'), html);
    console.log(`prerendered ${route} -> ${path.relative(distDir, path.join(outDir, 'index.html'))}`);
  }

  // SSR-бандл не нужен в продакшен-образе
  fs.rmSync(serverDir, { recursive: true, force: true });
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
