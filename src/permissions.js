// Карта прав админки: роль → доступные секции.
// Должна совпадать с правилами в WebSecurityConfig на бэке.
export const SECTIONS = {
  CUSTOM_ORDERS: 'CUSTOM_ORDERS',
  RETAIL: 'RETAIL',
  PRODUCTS: 'PRODUCTS',
  INVOICES: 'INVOICES',
  TRAINING_INVOICES: 'TRAINING_INVOICES',
  YOOKASSA_RECEIPTS: 'YOOKASSA_RECEIPTS',
};

const ROLE_SECTIONS = {
  ADMIN: [
    SECTIONS.CUSTOM_ORDERS,
    SECTIONS.RETAIL,
    SECTIONS.PRODUCTS,
    SECTIONS.INVOICES,
    SECTIONS.TRAINING_INVOICES,
    SECTIONS.YOOKASSA_RECEIPTS,
  ],
  SALES_MANAGER: [SECTIONS.CUSTOM_ORDERS, SECTIONS.RETAIL, SECTIONS.TRAINING_INVOICES],
  PROJECT_MANAGER: [SECTIONS.CUSTOM_ORDERS, SECTIONS.RETAIL],
};

export const getAllowedSections = (role) => ROLE_SECTIONS[role] || [];

// Какой секции принадлежит путь админки. null — общая страница (/admin, /admin/login).
export const sectionForPath = (pathname) => {
  if (pathname.startsWith('/admin/orders/custom')) return SECTIONS.CUSTOM_ORDERS;
  if (pathname.startsWith('/admin/orders')) return SECTIONS.RETAIL;
  if (pathname.startsWith('/admin/products')) return SECTIONS.PRODUCTS;
  if (pathname.startsWith('/admin/invoices/training')) return SECTIONS.TRAINING_INVOICES;
  if (pathname.startsWith('/admin/invoices/receipts')) return SECTIONS.YOOKASSA_RECEIPTS;
  if (pathname.startsWith('/admin/invoices')) return SECTIONS.INVOICES;
  return null;
};
