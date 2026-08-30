import { auth, db, googleProvider, signInWithPopup, signOut, deleteUser, reauthenticateWithPopup, ref, set, get, remove, onValue, off } from '../firebase.js';
import { updatePriceAnalyticsForCrop } from './analytics-service.js';

let currentUser = null;
let currentProfile = null;
const authListeners = [];

export function subscribeAuth(callback) {
  authListeners.push(callback);
  callback(currentUser, currentProfile);
  return () => {
    const idx = authListeners.indexOf(callback);
    if (idx > -1) authListeners.splice(idx, 1);
  };
}

function notifyAuth() {
  authListeners.forEach(cb => cb(currentUser, currentProfile));
}

export function getCurrentUser() {
  return currentUser;
}

export function getCurrentProfile() {
  return currentProfile;
}

export function isRegistrationComplete(profile) {
  return profile && profile.role && (profile.role === 'farmer' || profile.role === 'buyer') && profile.location;
}

export async function loginWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  const profileSnap = await get(ref(db, `users/${user.uid}`));

  if (profileSnap.exists()) {
    currentProfile = profileSnap.val();
  } else {
    currentProfile = null;
  }

  currentUser = user;
  notifyAuth();
  return { user, profile: currentProfile };
}

export async function logout() {
  await signOut(auth);
  currentUser = null;
  currentProfile = null;
  notifyAuth();
}

export async function deleteUserAccount() {
  if (!currentUser) throw new Error('No authenticated user');
  const uid = currentUser.uid;

  try {
    const productsSnap = await get(ref(db, 'products'));
    if (productsSnap.exists()) {
      const prods = productsSnap.val();
      const cropKeysToUpdate = new Map();
      for (const pid of Object.keys(prods)) {
        if (prods[pid].farmerId === uid) {
          cropKeysToUpdate.set(prods[pid].cropKey, prods[pid].cropName);
          await remove(ref(db, `products/${pid}`));
        }
      }
      for (const [cropKey, cropName] of cropKeysToUpdate.entries()) {
        await updatePriceAnalyticsForCrop(cropKey, cropName);
      }
    }
  } catch (e) {}

  try {
    const tendersSnap = await get(ref(db, 'tenders'));
    if (tendersSnap.exists()) {
      const tenders = tendersSnap.val();
      for (const tid of Object.keys(tenders)) {
        if (tenders[tid].buyerId === uid) {
          try { await remove(ref(db, `bids/${tid}`)); } catch (_) {}
          try { await remove(ref(db, `tenders/${tid}`)); } catch (_) {}
        }
      }
    }
  } catch (e) {}

  try {
    const allBidsSnap = await get(ref(db, 'bids'));
    if (allBidsSnap.exists()) {
      const allBids = allBidsSnap.val();
      for (const tenderId of Object.keys(allBids)) {
        const bidsForTender = allBids[tenderId];
        if (bidsForTender) {
          for (const bidId of Object.keys(bidsForTender)) {
            if (bidsForTender[bidId].farmerId === uid) {
              try { await remove(ref(db, `bids/${tenderId}/${bidId}`)); } catch (_) {}
            }
          }
        }
      }
    }
  } catch (e) {}

  try { await remove(ref(db, `notifications/${uid}`)); } catch (e) {}
  try { await remove(ref(db, `users/${uid}`)); } catch (e) {}

  const userToDelete = currentUser;
  try {
    await deleteUser(userToDelete);
  } catch (err) {
    if (err.code === 'auth/requires-recent-login') {
      await reauthenticateWithPopup(userToDelete, googleProvider);
      await deleteUser(userToDelete);
    } else {
      throw err;
    }
  }

  currentUser = null;
  currentProfile = null;
  notifyAuth();
}

export async function completeRegistration(role, displayName, location) {
  if (!currentUser) throw new Error('No authenticated user');

  const fullProfile = {
    uid: currentUser.uid,
    email: currentUser.email || '',
    displayName: displayName || currentUser.displayName || 'User',
    photoURL: currentUser.photoURL || '',
    role: role,
    location: location,
    createdAt: currentProfile?.createdAt || Date.now(),
    updatedAt: Date.now()
  };

  await set(ref(db, `users/${currentUser.uid}`), fullProfile);
  currentProfile = fullProfile;
  notifyAuth();
  return currentProfile;
}

export function initAuthListener() {
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      currentUser = user;
      const userRef = ref(db, `users/${user.uid}`);
      onValue(userRef, (snapshot) => {
        if (snapshot.exists()) {
          currentProfile = snapshot.val();
        } else {
          currentProfile = null;
        }
        notifyAuth();
      });
    } else {
      currentUser = null;
      currentProfile = null;
      notifyAuth();
    }
  });
}

