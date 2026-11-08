import { useState, useEffect } from 'react';
import { catalogApi } from '../api';

export function useBestSellers(limit = 10) {
  const [bestsellers, setBestsellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const fetchBestsellers = async () => {
      try {
        const res = await catalogApi.getBestSellingProducts(null, limit);
        let products = res.data?.data || [];

        // If backend returns fewer than 6 items (e.g. in development/test), fallback to active products enriched with ranking
        if (products.length < 6) {
          try {
            const fallbackRes = await catalogApi.getProducts(null, null, 0, limit);
            const fallbackList = fallbackRes.data?.data || [];
            // Merge unique items
            const seenIds = new Set(products.map(p => p.id));
            for (const p of fallbackList) {
              if (!seenIds.has(p.id)) {
                products.push(p);
                seenIds.add(p.id);
                if (products.length >= limit) break;
              }
            }
          } catch (fbErr) {
            // Keep what was fetched
          }
        }

        if (isMounted) {
          setBestsellers(products.slice(0, limit));
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load best sellers');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchBestsellers();

    return () => {
      isMounted = false;
    };
  }, [limit]);

  return { bestsellers, loading, error };
}
