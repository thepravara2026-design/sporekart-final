import { useState, useEffect, useRef } from 'react';
import { catalogApi } from '../api';

export function useHomeProducts({ category = null, sortBy = 'newest', page = 0, pageSize = 12 }) {
  const [products, setProducts] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const fetchProducts = async () => {
      try {
        const catParam = category && category !== 'all' ? category : null;
        
        // Use backend search/pagination API
        const res = await catalogApi.searchProducts({
          category: catParam,
          sortBy: sortBy || 'newest',
          page,
          size: pageSize,
        });

        const data = res.data?.data;
        if (data && isMounted) {
          if (Array.isArray(data.content)) {
            setProducts(data.content);
            setTotalElements(data.totalElements || data.content.length);
            setTotalPages(data.totalPages || Math.ceil((data.totalElements || data.content.length) / pageSize) || 1);
          } else if (Array.isArray(data)) {
            // In case a plain list is returned
            setProducts(data);
            setTotalElements(data.length);
            setTotalPages(Math.ceil(data.length / pageSize) || 1);
          }
          setError(null);
        }
      } catch (err) {
        // Fallback to catalogApi.getProducts
        try {
          const catParam = category && category !== 'all' ? category : null;
          const fallbackRes = await catalogApi.getProducts(null, catParam, page, pageSize);
          const raw = fallbackRes.data?.data || [];
          if (isMounted) {
            setProducts(raw);
            setTotalElements(raw.length);
            setTotalPages(Math.ceil(raw.length / pageSize) || 1);
            setError(null);
          }
        } catch (fbErr) {
          if (isMounted) {
            setError(err.message || 'Unable to load products. Please check your connection.');
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      isMounted = false;
    };
  }, [category, sortBy, page, pageSize]);

  return {
    products,
    totalElements,
    totalPages,
    loading,
    error,
  };
}
