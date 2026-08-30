import { db, ref, set, get, update, push, onValue, off } from '../firebase.js';

export async function createTopic(topicData) {
  const topicsRef = ref(db, 'farmer_topics');
  const newTopicRef = push(topicsRef);
  const topicId = newTopicRef.key;

  const payload = {
    topicId,
    title: topicData.title.trim(),
    cropName: topicData.cropName ? topicData.cropName.trim() : 'General Discussion',
    creatorId: topicData.creatorId,
    creatorName: topicData.creatorName,
    lastMessageText: 'Topic created',
    lastMessageTimestamp: Date.now(),
    messageCount: 0,
    createdAt: Date.now()
  };

  await set(newTopicRef, payload);
  return payload;
}

export async function sendMessage(topicId, messageData) {
  const messagesRef = ref(db, `farmer_messages/${topicId}`);
  const newMsgRef = push(messagesRef);
  const messageId = newMsgRef.key;

  const payload = {
    messageId,
    topicId,
    senderId: messageData.senderId,
    senderName: messageData.senderName,
    senderPhoto: messageData.senderPhoto || '',
    text: messageData.text.trim(),
    timestamp: Date.now()
  };

  await set(newMsgRef, payload);

  await update(ref(db, `farmer_topics/${topicId}`), {
    lastMessageText: payload.text,
    lastMessageTimestamp: payload.timestamp
  });

  return payload;
}

export function subscribeTopics(callback) {
  const topicsRef = ref(db, 'farmer_topics');
  onValue(topicsRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const val = snapshot.val();
    const list = Object.values(val).sort((a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp);
    callback(list);
  });

  return () => off(topicsRef);
}

export function subscribeMessages(topicId, callback) {
  const messagesRef = ref(db, `farmer_messages/${topicId}`);
  onValue(messagesRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const val = snapshot.val();
    const list = Object.values(val).sort((a, b) => a.timestamp - b.timestamp);
    callback(list);
  });

  return () => off(messagesRef);
}
