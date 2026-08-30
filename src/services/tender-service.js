import { db, ref, set, get, update, push, onValue, off, runTransaction } from '../firebase.js';

export async function createTender(tenderData) {
  const tendersRef = ref(db, 'tenders');
  const newTenderRef = push(tendersRef);
  const tenderId = newTenderRef.key;

  const durationMinutes = Math.min(Math.max(parseInt(tenderData.durationMinutes || 60), 5), 240);
  const expiresAt = Date.now() + (durationMinutes * 60 * 1000);
  const cropKey = (tenderData.cropName || '').trim().toLowerCase().replace(/\s+/g, '_');

  const payload = {
    tenderId,
    buyerId: tenderData.buyerId,
    buyerName: tenderData.buyerName,
    buyerLocation: tenderData.buyerLocation || 'Market Hub',
    tenderType: tenderData.tenderType || 'open',
    targetFarmerId: tenderData.targetFarmerId || null,
    targetFarmerName: tenderData.targetFarmerName || null,
    cropKey,
    cropName: tenderData.cropName.trim(),
    requiredQuantity: parseFloat(tenderData.requiredQuantity),
    unit: tenderData.unit || 'kg',
    targetPricePerUnit: parseFloat(tenderData.targetPricePerUnit || 0),
    currentBestBid: null,
    currentBestBidderId: null,
    currentBestBidderName: null,
    bidCount: 0,
    description: tenderData.description || '',
    status: 'open',
    durationMinutes,
    expiresAt,
    awardedTo: null,
    awardedBidId: null,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  await set(newTenderRef, payload);
  return payload;
}

export async function placeBid(tenderId, bidData) {
  const tenderRef = ref(db, `tenders/${tenderId}`);
  const tenderSnap = await get(tenderRef);
  
  if (!tenderSnap.exists()) throw new Error('Tender does not exist');
  const tender = tenderSnap.val();
  
  if (tender.status !== 'open') throw new Error('This tender is closed or already awarded');
  if (Date.now() > tender.expiresAt) throw new Error('This tender has expired');

  if (tender.tenderType === 'direct' && tender.targetFarmerId && tender.targetFarmerId !== bidData.farmerId) {
    throw new Error('This tender is directed to a specific farmer');
  }

  const bidPrice = parseFloat(bidData.bidPricePerUnit);
  if (isNaN(bidPrice) || bidPrice <= 0) throw new Error('Invalid bid price');

  const bidsRef = ref(db, `bids/${tenderId}`);
  const newBidRef = push(bidsRef);
  const bidId = newBidRef.key;

  const bidPayload = {
    bidId,
    tenderId,
    farmerId: bidData.farmerId,
    farmerName: bidData.farmerName,
    farmerLocation: bidData.farmerLocation || 'Local Farm',
    bidPricePerUnit: bidPrice,
    offeredQuantity: parseFloat(bidData.offeredQuantity || tender.requiredQuantity),
    unit: tender.unit,
    deliveryDays: parseInt(bidData.deliveryDays || 1),
    proposalNote: bidData.proposalNote || '',
    createdAt: Date.now()
  };

  await set(newBidRef, bidPayload);

  await runTransaction(tenderRef, (currentTender) => {
    if (!currentTender) return currentTender;
    const isFirstBid = currentTender.currentBestBid === null || currentTender.currentBestBid === undefined;
    const isBetterBid = isFirstBid || bidPrice < currentTender.currentBestBid;

    currentTender.bidCount = (currentTender.bidCount || 0) + 1;
    currentTender.updatedAt = Date.now();

    if (isBetterBid) {
      currentTender.currentBestBid = bidPrice;
      currentTender.currentBestBidderId = bidData.farmerId;
      currentTender.currentBestBidderName = bidData.farmerName;
    }
    return currentTender;
  });

  const notifRef = push(ref(db, `notifications/${tender.buyerId}`));
  await set(notifRef, {
    notificationId: notifRef.key,
    recipientId: tender.buyerId,
    type: 'bid_received',
    title: `New Bid on ${tender.cropName}`,
    body: `${bidData.farmerName} bid ₹${bidPrice}/${tender.unit} on your tender.`,
    referenceId: tenderId,
    isRead: false,
    timestamp: Date.now()
  });

  return bidPayload;
}

export async function awardTender(tenderId, bid) {
  const tenderRef = ref(db, `tenders/${tenderId}`);
  const updates = {
    status: 'awarded',
    awardedTo: bid.farmerId,
    awardedFarmerName: bid.farmerName,
    awardedBidId: bid.bidId,
    finalPricePerUnit: bid.bidPricePerUnit,
    updatedAt: Date.now()
  };

  await update(tenderRef, updates);

  const notifRef = push(ref(db, `notifications/${bid.farmerId}`));
  await set(notifRef, {
    notificationId: notifRef.key,
    recipientId: bid.farmerId,
    type: 'tender_awarded',
    title: 'Tender Awarded to You!',
    body: `Congratulations! Your bid of ₹${bid.bidPricePerUnit}/${bid.unit} was accepted.`,
    referenceId: tenderId,
    isRead: false,
    timestamp: Date.now()
  });
}

export async function closeTender(tenderId) {
  await update(ref(db, `tenders/${tenderId}`), {
    status: 'closed',
    updatedAt: Date.now()
  });
}

export function subscribeTenders(callback) {
  const tendersRef = ref(db, 'tenders');
  onValue(tendersRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const val = snapshot.val();
    callback(Object.values(val));
  });

  return () => off(tendersRef);
}

export function subscribeTenderBids(tenderId, callback) {
  const bidsRef = ref(db, `bids/${tenderId}`);
  onValue(bidsRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const val = snapshot.val();
    const list = Object.values(val).sort((a, b) => a.bidPricePerUnit - b.bidPricePerUnit);
    callback(list);
  });

  return () => off(bidsRef);
}

export function subscribeSingleTender(tenderId, callback) {
  const tenderRef = ref(db, `tenders/${tenderId}`);
  onValue(tenderRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }
    callback(snapshot.val());
  });

  return () => off(tenderRef);
}
