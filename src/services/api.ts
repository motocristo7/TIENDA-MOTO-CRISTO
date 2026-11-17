import { ExchangeRateInfo } from '../types';

const BCV_CACHE_KEY = 'mercadomoto_bcv_rate_cache';

export const ApiService = {
  /**
   * Fetches official live Venezuelan BCV rate as fallback if settings/business doesn't define bcvRate
   */
  async getBcvRate(): Promise<ExchangeRateInfo> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const rate = Number(data.promedio || data.precio || 52.85);
        if (rate > 0) {
          const rateInfo: ExchangeRateInfo = {
            rateBcv: rate,
            lastUpdated: new Date().toISOString(),
            source: 'Banco Central de Venezuela (BCV Oficial en Vivo)',
            isCustom: false,
          };
          localStorage.setItem(BCV_CACHE_KEY, JSON.stringify(rateInfo));
          return rateInfo;
        }
      }
    } catch {
      try {
        const controller2 = new AbortController();
        const timeoutId2 = setTimeout(() => controller2.abort(), 2500);
        const res2 = await fetch('https://pydolarvenezuela-api.vercel.app/api/v1/dollar?page=bcv', {
          signal: controller2.signal,
        });
        clearTimeout(timeoutId2);

        if (res2.ok) {
          const data2 = await res2.json();
          const rate = Number(data2.monitors?.usd?.price || 52.85);
          if (rate > 0) {
            const rateInfo: ExchangeRateInfo = {
              rateBcv: rate,
              lastUpdated: new Date().toISOString(),
              source: 'BCV Oficial (PyDolar en Vivo)',
              isCustom: false,
            };
            localStorage.setItem(BCV_CACHE_KEY, JSON.stringify(rateInfo));
            return rateInfo;
          }
        }
      } catch {
        // ignore
      }
    }

    try {
      const cached = localStorage.getItem(BCV_CACHE_KEY);
      if (cached) return JSON.parse(cached);
    } catch {
      // ignore
    }

    return {
      rateBcv: 52.85,
      lastUpdated: new Date().toISOString(),
      source: 'Referencial Oficial BCV',
      isCustom: false,
    };
  },
};
