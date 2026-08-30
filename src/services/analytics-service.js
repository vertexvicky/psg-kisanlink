import { db, ref, set, get, onValue, off } from '../firebase.js';

export async function updatePriceAnalyticsForCrop(cropKey, cropName) {
  if (!cropKey) return;
  const productsSnap = await get(ref(db, 'products'));
  if (!productsSnap.exists()) {
    await set(ref(db, `price_analytics/${cropKey}`), {
      cropKey,
      cropName,
      minPrice: 0,
      maxPrice: 0,
      avgPrice: 0,
      activeListingsCount: 0,
      lastUpdated: Date.now()
    });
    return;
  }

  const all = Object.values(productsSnap.val());
  const matching = all.filter(p => p.cropKey === cropKey && p.isActive && typeof p.pricePerUnit === 'number');

  if (matching.length === 0) {
    await set(ref(db, `price_analytics/${cropKey}`), {
      cropKey,
      cropName: cropName || cropKey,
      minPrice: 0,
      maxPrice: 0,
      avgPrice: 0,
      activeListingsCount: 0,
      lastUpdated: Date.now()
    });
    return;
  }

  const prices = matching.map(p => p.pricePerUnit);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = Math.round((prices.reduce((sum, p) => sum + p, 0) / prices.length) * 100) / 100;

  const payload = {
    cropKey,
    cropName: matching[0].cropName || cropName,
    unit: matching[0].unit || 'kg',
    minPrice,
    maxPrice,
    avgPrice,
    activeListingsCount: matching.length,
    lastUpdated: Date.now()
  };

  await set(ref(db, `price_analytics/${cropKey}`), payload);
}

export function subscribePriceAnalytics(callback) {
  const analyticsRef = ref(db, 'price_analytics');
  onValue(analyticsRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const val = snapshot.val();
    callback(Object.values(val));
  });

  return () => off(analyticsRef);
}
