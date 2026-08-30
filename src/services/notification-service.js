import { db, ref, onValue, off, update } from '../firebase.js';

export function subscribeUserNotifications(uid, callback) {
  if (!uid) return () => {};
  const notifRef = ref(db, `notifications/${uid}`);
  onValue(notifRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const val = snapshot.val();
    const list = Object.values(val).sort((a, b) => b.timestamp - a.timestamp);
    callback(list);
  });

  return () => off(notifRef);
}

export async function markNotificationRead(uid, notificationId) {
  await update(ref(db, `notifications/${uid}/${notificationId}`), {
    isRead: true
  });
}
