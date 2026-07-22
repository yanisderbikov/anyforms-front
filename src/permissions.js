// Карта прав админки: роль → доступные секции.
// Должна совпадать с правилами в WebSecurityConfig на бэке.
export const SECTIONS = {
  CUSTOM_ORDERS: 'CUSTOM_ORDERS',
  RETAIL: 'RETAIL',
  PRODUCTS: 'PRODUCTS',
  INVOICES: 'INVOICES',
};

const ROLE_SECTIONS = {
  ADMIN: [SECTIONS.CUSTOM_ORDERS, SECTIONS.RETAIL, SECTIONS.PRODUCTS, SECTIONS.INVOICES],
  SALES_MANAGER: [SECTIONS.CUSTOM_ORDERS, SECTIONS.RETAIL],
  PROJECT_MANAGER: [SECTIONS.CUSTOM_ORDERS, SECTIONS.RETAIL],
};

export const getAllowedSections = (role) => ROLE_SECTIONS[role] || [];

// Какой секции принадлежит путь админки. null — общая страница (/admin, /admin/login).
export const sectionForPath = (pathname) => {
  if (pathname.startsWith('/admin/orders/custom')) return SECTIONS.CUSTOM_ORDERS;
  if (pathname.startsWith('/admin/orders')) return SECTIONS.RETAIL;
  if (pathname.startsWith('/admin/products')) return SECTIONS.PRODUCTS;
  if (pathname.startsWith('/admin/invoices')) return SECTIONS.INVOICES;
  return null;
};
