import { useState, useEffect, useCallback } from 'react';

const MAX_HISTORY = 10;

export function useRecentlyViewed(user = null) {
  const storageKey = user?.id 
    ? `sporekart_recently_viewed_user_${user.id}` 
    : 'sporekart_recently_viewed_guest';

  const [items, setItems] = useState([]);

  // Load from localStorage on mount, user change, or storage updates
  useEffect(() => {
    const loadItems = () => {
      try {
        let raw = localStorage.getItem(storageKey);
        // If user is logged in but their user-specific history is empty, check if they browsed as guest in this browser session
        if (!raw && user?.id) {
          const guestRaw = localStorage.getItem('sporekart_recently_viewed_guest');
          if (guestRaw) {
            raw = guestRaw;
            localStorage.setItem(storageKey, guestRaw);
          }
        }
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setItems(parsed);
            return;
          }
        }
      } catch (e) {
        console.warn('Failed to parse recently viewed storage:', e);
      }
      setItems([]);
    };

    loadItems();

    const handleUpdate = () => loadItems();
    window.addEventListener('sporekart_recently_viewed_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('sporekart_recently_viewed_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [storageKey, user?.id]);

  const addItem = useCallback((item) => {
    if (!item || !item.id) return;

    setItems((prev) => {
      // Filter out duplicate if it already exists
      const filtered = prev.filter((i) => i.id !== item.id);
      const cleanItem = {
        id: item.id,
        slug: item.slug || item.id,
        title: item.title || item.name || 'Sporekart Item',
        imageUrl: item.imageUrl || item.imageUrls?.[0] || item.thumbnailUrl || '/sporekart-white-button.jpg',
        priceInr: item.priceInr || item.variants?.[0]?.priceInr || item.feeInr || null,
        compareAtPriceInr: item.variants?.[0]?.compareAtPriceInr || null,
        categoryName: item.categoryName || (item.category?.name) || (item.type === 'training' ? 'Masterclass' : 'Mushroom'),
        type: item.type === 'training' || item.batchCode || item.durationWeeks ? 'training' : 'product',
        rating: item.averageRating || 4.9,
        viewedAt: Date.now(),
      };

      const updated = [cleanItem, ...filtered].slice(0, MAX_HISTORY);
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
        window.dispatchEvent(new Event('sporekart_recently_viewed_updated'));
      } catch (e) {
        console.warn('Failed to save recently viewed storage:', e);
      }
      return updated;
    });
  }, [storageKey]);

  const clearItems = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      window.dispatchEvent(new Event('sporekart_recently_viewed_updated'));
    } catch (e) {
      console.warn('Failed to clear recently viewed storage:', e);
    }
    setItems([]);
  }, [storageKey]);

  return {
    items,
    addItem,
    clearItems,
  };
}
