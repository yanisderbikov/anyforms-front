import { useEffect, useState } from 'react';
import apiClient from '../apiClient';

let settingsPromise = null;
const loadSettings = () => {
  if (!settingsPromise) {
    settingsPromise = apiClient.instance
      .get('/api/public/free-delivery')
      .then(({ data }) => data)
      .catch((err) => {
        settingsPromise = null;
        throw err;
      });
  }
  return settingsPromise;
};

export function useFreeDelivery() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    let cancelled = false;
    loadSettings()
      .then((data) => {
        if (!cancelled) setSettings(data);
      })
      .catch(() => {
        if (!cancelled) setSettings(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const enabled = Boolean(settings?.enabled && settings?.thresholdKopecks > 0);
  const thresholdRub = enabled ? settings.thresholdKopecks / 100 : null;

  const qualifies = (amountRub) => enabled && Math.round(amountRub * 100) >= settings.thresholdKopecks;
  const remainingRub = (amountRub) =>
    enabled ? Math.max(0, Math.ceil((settings.thresholdKopecks - Math.round(amountRub * 100)) / 100)) : null;

  return { enabled, thresholdRub, qualifies, remainingRub };
}
