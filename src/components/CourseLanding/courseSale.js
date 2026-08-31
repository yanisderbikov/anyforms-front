import { useEffect, useState } from 'react';

// Предзаказ курса закрывается в 00:00 1 сентября 2026 по Москве (UTC+3).
export const SALE_END_MS = Date.parse('2026-09-01T00:00:00+03:00');

// Набор на «Личное ведение» закрыт: тариф остаётся на витрине, но не продаётся.
export const PERSONAL_CLOSED = true;

const pad = (n) => String(n).padStart(2, '0');

const plural = (n, one, few, many) => {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return many;
  const mod10 = n % 10;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
};

// Остаток до закрытия предзаказа; closed — время вышло.
export const getSaleLeft = (nowMs = Date.now()) => {
  const diff = Math.max(0, SALE_END_MS - nowMs);
  const total = Math.floor(diff / 1000);
  return {
    closed: diff <= 0,
    days: Math.floor(total / 86400),
    hours: pad(Math.floor((total % 86400) / 3600)),
    minutes: pad(Math.floor((total % 3600) / 60)),
    seconds: pad(total % 60),
  };
};

export const daysLabel = (n) => plural(n, 'день', 'дня', 'дней');

// Тикает раз в секунду и останавливается, когда предзаказ закрылся.
export const useSaleCountdown = () => {
  const [left, setLeft] = useState(() => getSaleLeft());
  useEffect(() => {
    if (left.closed) return undefined;
    const id = setInterval(() => setLeft(getSaleLeft()), 1000);
    return () => clearInterval(id);
  }, [left.closed]);
  return left;
};
