import { db, ref, set, get, update, remove, push, onValue, off } from '../firebase.js';
import { updatePriceAnalyticsForCrop } from './analytics-service.js';

export async function createProduct(productData) {
  const productsRef = ref(db, 'products');
  const newProductRef = push(productsRef);
  const productId = newProductRef.key;

  const cropKey = (productData.cropName || '').trim().toLowerCase().replace(/\s+/g, '_');
  
  const payload = {
    productId,
    farmerId: productData.farmerId,
    farmerName: productData.farmerName,
    farmerLocation: productData.farmerLocation || 'Local Farm',
    cropKey,
    cropName: productData.cropName.trim(),
    description: productData.description || '',
    pricePerUnit: parseFloat(productData.pricePerUnit),
    unit: productData.unit || 'kg',
    availableQuantity: parseFloat(productData.availableQuantity),
    minOrderQuantity: parseFloat(productData.minOrderQuantity || 1),
    imageUrl: productData.imageUrl || '',
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  await set(newProductRef, payload);
  await updatePriceAnalyticsForCrop(cropKey, payload.cropName);
  return payload;
}

export async function updateProduct(productId, updates) {
  const productRef = ref(db, `products/${productId}`);
  const currentSnap = await get(productRef);
  if (!currentSnap.exists()) throw new Error('Product not found');
  
  const current = currentSnap.val();
  const merged = {
    ...updates,
    updatedAt: Date.now()
  };
  
  await update(productRef, merged);
  await updatePriceAnalyticsForCrop(current.cropKey, current.cropName);
  return merged;
}

export async function deleteProduct(productId) {
  const productRef = ref(db, `products/${productId}`);
  const currentSnap = await get(productRef);
  if (!currentSnap.exists()) return;
  const current = currentSnap.val();
  
  await remove(productRef);
  await updatePriceAnalyticsForCrop(current.cropKey, current.cropName);
}

export function subscribeProducts(callback) {
  const productsRef = ref(db, 'products');
  onValue(productsRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const val = snapshot.val();
    const list = Object.keys(val).map(key => val[key]);
    callback(list);
  });

  return () => off(productsRef);
}

export async function getProductById(productId) {
  const snap = await get(ref(db, `products/${productId}`));
  return snap.exists() ? snap.val() : null;
}

export async function getKnownCropNames() {
  const names = new Set([
    'Sharbati Wheat', 'Basmati Rice', 'Red Onion', 'Hybrid Tomato', 
    'Jyoti Potato', 'BT Cotton', 'Robusta Banana', 'Alphonso Mango', 
    'Guntur Chilli', 'Salem Turmeric', 'Green Gram (Moong)', 'Soybean', 
    'Groundnut', 'Mustard', 'Sugarcane', 'Garlic', 'Ginger', 'Maize (Corn)'
  ]);

  try {
    const productsSnap = await get(ref(db, 'products'));
    if (productsSnap.exists()) {
      Object.values(productsSnap.val()).forEach(p => {
        if (p.cropName) names.add(p.cropName.trim());
      });
    }

    const analyticsSnap = await get(ref(db, 'price_analytics'));
    if (analyticsSnap.exists()) {
      Object.values(analyticsSnap.val()).forEach(a => {
        if (a.cropName) names.add(a.cropName.trim());
      });
    }

    const tendersSnap = await get(ref(db, 'tenders'));
    if (tendersSnap.exists()) {
      Object.values(tendersSnap.val()).forEach(t => {
        if (t.cropName) names.add(t.cropName.trim());
      });
    }
  } catch {
    // Fail silently and return base list
  }

  return Array.from(names).sort((a, b) => a.localeCompare(b));
}
