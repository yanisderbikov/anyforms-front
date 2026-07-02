import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import MainLanding from './components/MainLanding/MainLanding';
import Print3dLanding from './components/Print3dLanding/Print3dLanding';

// Только маршруты из этого списка попадают в SSR-бандл: остальные страницы
// приложения не обязаны быть SSR-безопасными.
const ROUTES = {
  '/': MainLanding,
  '/3d-print': Print3dLanding,
};

export function render(url) {
  const Page = ROUTES[url];
  if (!Page) {
    throw new Error(`No prerender entry for route: ${url}`);
  }
  return renderToString(
    <StaticRouter location={url}>
      <Page />
    </StaticRouter>
  );
}

export const prerenderRoutes = Object.keys(ROUTES);
