import React, { useCallback, useEffect, useRef, useState } from 'react';
import apiClient from '../../apiClient';
import { DEFAULT_SHOP_SLUG } from '../../context/CartContext';
import { normalizePromoCode } from '../../shared/promoTracking';
import { readCheckoutContact, saveCheckoutContact } from '../../shared/checkoutContactStorage';
import { getDeviceId } from '../../shared/deviceId';
import { readCheckoutForm } from '../Marketplace/checkoutFormStorage';
import { trackPromoPopup } from '../../services/analytics';
import PromoPopup from './PromoPopup';
import {
  isPopupSuppressed,
  readElapsed,
  readPopupState,
  recordPopupShown,
  writeElapsed,
  writePopupState,
} from './promoPopupFrequency';

const SHOP_RESERVED_SEGMENTS = new Set(['product', 'cart', 'checkout', 'success', 'offer']);
const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

export const popupShopSlugForPath = (pathname) => {
  if (pathname === '/shop' || /^\/shop\/product\/[^/]+$/.test(pathname)) return DEFAULT_SHOP_SLUG;
  const match = pathname.match(/^\/shop\/([^/]+)(?:\/product\/[^/]+)?$/);
  if (match && !SHOP_RESERVED_SEGMENTS.has(match[1])) return match[1];
  return null;
};

const savedPromoCode = () => normalizePromoCode(readCheckoutForm()?.promoInput || '');

const knownContact = () => {
  const saved = readCheckoutContact() || {};
  const phone = String(saved.phone || '').trim();
  const email = String(saved.email || '').trim();
  return { phone: phone || undefined, email: email || undefined };
};

const saveContactForCheckout = (contact) => {
  const saved = readCheckoutContact() || {};
  saveCheckoutContact({
    fullName: saved.fullName || '',
    phone: saved.phone || contact.phone,
    email: saved.email || contact.email,
  });
};

const hasKnownContact = () => {
  const { phone, email } = knownContact();
  return Boolean(phone || email);
};

const isSuppressed = (popup) =>
  (popup.hideForKnownContacts !== false && hasKnownContact()) ||
  isPopupSuppressed(popup, { savedPromoCode: savedPromoCode() });

const utmFromSearch = (search) => {
  const params = new URLSearchParams(search);
  return Object.fromEntries(
    UTM_PARAMS.map((key) => [key.replace(/_(\w)/, (_, c) => c.toUpperCase()), params.get(key) || undefined]),
  );
};

const errorMessage = (err) =>
  err?.response?.data?.message ||
  (err?.response?.status === 429 ? 'Слишком много попыток. Попробуйте через несколько минут.' : '') ||
  'Не удалось получить промокод. Попробуйте ещё раз.';

const issueCode = async (popup, search) => {
  try {
    const { data } = await apiClient.instance.post(`/api/public/promo-popup/${popup.id}/issue`, {
      ...knownContact(),
      ...utmFromSearch(search),
      deviceId: getDeviceId(),
      pageUrl: window.location.href,
    });
    trackPromoPopup('issued', popup, { code: data.code, repeated: Boolean(data.repeated) });
    return data;
  } catch (err) {
    trackPromoPopup('error', popup, { reason: errorMessage(err) });
    return null;
  }
};

const PromoPopupHost = ({ pathname, search }) => {
  const shopSlug = popupShopSlugForPath(pathname);
  const [popupsByShop, setPopupsByShop] = useState({});
  const [open, setOpen] = useState(false);
  const [issued, setIssued] = useState(null);
  const shownRef = useRef(false);
  const searchRef = useRef(search);
  searchRef.current = search;
  const popup = shopSlug ? popupsByShop[shopSlug] : null;

  useEffect(() => {
    if (!shopSlug || shopSlug in popupsByShop) return undefined;
    let cancelled = false;
    apiClient.instance
      .post('/api/public/promo-popup/active', { shop: shopSlug, deviceId: getDeviceId(), ...knownContact() })
      .then(({ status, data }) => {
        if (!cancelled) setPopupsByShop((prev) => ({ ...prev, [shopSlug]: status === 200 && data?.id ? data : null }));
      })
      .catch(() => {
        if (!cancelled) setPopupsByShop((prev) => ({ ...prev, [shopSlug]: null }));
      });
    return () => {
      cancelled = true;
    };
  }, [shopSlug, popupsByShop]);

  useEffect(() => {
    if (!popup || open || shownRef.current || isSuppressed(popup)) return undefined;
    const delayMs = Math.max(0, (popup.delaySeconds ?? 15) * 1000);
    const startedAt = Date.now();
    const elapsedBefore = readElapsed(popup.id);
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      if (isSuppressed(popup)) return;
      shownRef.current = true;
      if (popup.popupType === 'UNIQUE_CODE') {
        const code = await issueCode(popup, searchRef.current);
        if (!code || cancelled) return;
        setIssued(code);
      }
      recordPopupShown(popup);
      setOpen(true);
      apiClient.instance
        .post(`/api/public/promo-popup/${popup.id}/view`, { deviceId: getDeviceId() })
        .catch(() => undefined);
      trackPromoPopup('shown', popup, { code: popup.code });
    }, Math.max(0, delayMs - elapsedBefore));
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      writeElapsed(popup.id, elapsedBefore + (Date.now() - startedAt));
    };
  }, [popup, open]);

  useEffect(() => {
    if (open && !popup) setOpen(false);
  }, [open, popup]);

  const handleClose = useCallback(() => {
    if (!popup) return;
    setOpen(false);
    const state = readPopupState(popup.id);
    if (!state.claimedAt && !state.takenAt) {
      trackPromoPopup('closed', popup, { code: popup.code || issued?.code });
    }
  }, [popup, issued]);

  const handleTakeCode = useCallback(
    (code) => {
      if (!popup) return;
      writePopupState(popup.id, { takenAt: Date.now() });
      trackPromoPopup('code_taken', popup, { code });
    },
    [popup],
  );

  const handleCopy = useCallback(
    (code) => {
      if (!popup) return;
      trackPromoPopup('copied', popup, { code });
    },
    [popup],
  );

  const handleSubmit = useCallback(
    async (form) => {
      trackPromoPopup('submit', popup);
      try {
        const { data } = await apiClient.instance.post(`/api/public/promo-popup/${popup.id}/claim`, {
          ...form,
          ...utmFromSearch(search),
          deviceId: getDeviceId(),
          consentVersion: popup.consentVersion,
          pageUrl: window.location.href,
        });
        writePopupState(popup.id, { claimedAt: Date.now() });
        saveContactForCheckout({ phone: form.phone, email: form.email });
        trackPromoPopup('claimed', popup, { code: data.code, repeated: Boolean(data.repeated) });
        return data;
      } catch (err) {
        const message = errorMessage(err);
        trackPromoPopup('error', popup, { reason: message });
        throw new Error(message);
      }
    },
    [popup, search],
  );

  if (!open || !popup) return null;
  return (
    <PromoPopup
      popup={popup}
      mode="live"
      onSubmit={handleSubmit}
      onClose={handleClose}
      onTakeCode={handleTakeCode}
      onCopy={handleCopy}
      issued={issued}
    />
  );
};

export default PromoPopupHost;
