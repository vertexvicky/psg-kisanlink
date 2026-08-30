import { getCurrentUser, getCurrentProfile } from '../services/auth-service.js';
import { subscribeTopics, subscribeMessages, sendMessage, createTopic } from '../services/chat-service.js';
import { getKnownCropNames } from '../services/product-service.js';
import { timeAgo, escapeHtml } from '../utils.js';
import { openModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { setupCropAutocomplete } from '../components/autocomplete.js';

let topicsList = [];
let activeTopicId = null;
let currentMessages = [];
let msgUnsub = null;

export function renderFarmerChatPage() {
  const profile = getCurrentProfile();

  return `
    <div class="container dashboard-layout">
      <div class="page-header">
        <div>
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
            <h1 style="font-size: 2rem;">Farmer Discussion Mandi</h1>
            <span class="badge badge-primary">Private Farmer Forum</span>
          </div>
          <p style="color: var(--text-secondary); font-size: 0.95rem;">
            Direct farmer-to-farmer discussion on local mandi arrivals, pricing benchmarks, and buyer reliability.
          </p>
        </div>

        <button id="new-topic-btn" class="btn btn-primary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Start New Topic
        </button>
      </div>

      <div class="chat-room-container">
        <div class="chat-topics-sidebar">
          <div style="padding: 1rem; border-bottom: 1px solid var(--border-subtle); font-weight: 700; font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase;">
            Mandi Discussion Rooms
          </div>
          <div id="topics-list-scroll" style="overflow-y: auto; flex-grow: 1;">
            <div style="padding: 2rem; text-align: center; color: var(--text-tertiary);">Loading topics...</div>
          </div>
        </div>

        <div class="chat-main-area">
          <div class="chat-header" id="chat-active-header">
            <div>
              <h3 id="active-topic-title" style="font-size: 1.1rem; margin-bottom: 0.15rem;">Select a topic</h3>
              <span id="active-topic-meta" style="font-size: 0.78rem; color: var(--text-tertiary);">Join real-time mandi talk</span>
            </div>
          </div>

          <div class="chat-messages-scroll" id="chat-messages-container">
            <div style="text-align: center; color: var(--text-tertiary); margin: auto;">Select a discussion topic on the left to start reading messages.</div>
          </div>

          <form id="chat-send-form" class="chat-input-bar">
            <input type="text" id="chat-input-field" class="input-control" placeholder="Share pricing insights, mandi rates, or ask questions..." required autocomplete="off" disabled />
            <button type="submit" id="chat-send-btn" class="btn btn-primary btn-icon" disabled aria-label="Send">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  `;
}

function renderTopicsList() {
  const container = document.getElementById('topics-list-scroll');
  if (!container) return;

  if (topicsList.length === 0) {
    container.innerHTML = `
      <div style="padding: 2rem 1rem; text-align: center; color: var(--text-tertiary); font-size: 0.85rem;">
        No topics yet.<br />Be the first to start a conversation!
      </div>
    `;
    return;
  }

  container.innerHTML = topicsList.map(topic => `
    <div class="chat-topic-item ${topic.topicId === activeTopicId ? 'active' : ''}" data-id="${topic.topicId}">
      <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.2rem;">
        <strong style="font-size: 0.9rem; color: var(--text-primary);">${escapeHtml(topic.title)}</strong>
      </div>
      <div style="font-size: 0.75rem; color: var(--primary-500); font-weight: 600; margin-bottom: 0.25rem;">
        🌾 ${escapeHtml(topic.cropName || 'General')}
      </div>
      <div style="font-size: 0.78rem; color: var(--text-tertiary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
        ${escapeHtml(topic.lastMessageText || 'No messages yet')}
      </div>
      <div style="font-size: 0.7rem; color: var(--text-tertiary); margin-top: 0.25rem; text-align: right;">
        ${timeAgo(topic.lastMessageTimestamp)}
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.chat-topic-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = item.getAttribute('data-id');
      selectTopic(id);
    });
  });
}

function selectTopic(topicId) {
  activeTopicId = topicId;
  renderTopicsList();

  const topic = topicsList.find(t => t.topicId === topicId);
  const titleEl = document.getElementById('active-topic-title');
  const metaEl = document.getElementById('active-topic-meta');
  const inputEl = document.getElementById('chat-input-field');
  const sendBtn = document.getElementById('chat-send-btn');

  if (titleEl && topic) titleEl.textContent = topic.title;
  if (metaEl && topic) metaEl.textContent = `Crop Focus: ${topic.cropName} • Started by ${topic.creatorName}`;

  if (inputEl) inputEl.disabled = false;
  if (sendBtn) sendBtn.disabled = false;

  if (msgUnsub) msgUnsub();

  const msgsContainer = document.getElementById('chat-messages-container');
  if (msgsContainer) {
    msgsContainer.innerHTML = '<div style="text-align: center; color: var(--text-tertiary); margin: auto;">Loading messages...</div>';
  }

  msgUnsub = subscribeMessages(topicId, (messages) => {
    currentMessages = messages;
    renderMessages();
  });
}

function renderMessages() {
  const container = document.getElementById('chat-messages-container');
  if (!container) return;

  const user = getCurrentUser();
  if (!user) return;

  if (currentMessages.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-tertiary); margin: auto; padding: 2rem;">
        No messages yet in this discussion. Send the first message below!
      </div>
    `;
    return;
  }

  container.innerHTML = currentMessages.map(msg => {
    const isMine = msg.senderId === user.uid;
    return `
      <div class="chat-bubble ${isMine ? 'chat-bubble-mine' : 'chat-bubble-other'} animate-fade-in">
        ${!isMine ? `<div style="font-size: 0.72rem; font-weight: 700; color: var(--primary-500); margin-bottom: 2px;">${escapeHtml(msg.senderName)}</div>` : ''}
        <div>${escapeHtml(msg.text)}</div>
        <div style="font-size: 0.65rem; color: ${isMine ? 'rgba(255,255,255,0.75)' : 'var(--text-tertiary)'}; text-align: right; margin-top: 3px;">
          ${timeAgo(msg.timestamp)}
        </div>
      </div>
    `;
  }).join('');

  container.scrollTop = container.scrollHeight;
}

async function openCreateTopicModal() {
  const user = getCurrentUser();
  const profile = getCurrentProfile();
  if (!user) return;

  const knownCrops = await getKnownCropNames();
  const datalistOptions = knownCrops.map(name => `<option value="${escapeHtml(name)}">`).join('');

  const modalHtml = `
    <form id="new-topic-form">
      <div class="input-group">
        <label class="input-label" for="nt-title">Discussion Subject / Question *</label>
        <input type="text" id="nt-title" class="input-control" required placeholder="e.g. Onion rates falling in Lasalgaon Mandi today?" />
      </div>

      <div class="input-group">
        <label class="input-label" for="nt-crop">Related Crop Name</label>
        <input type="text" id="nt-crop" class="input-control" placeholder="e.g. Red Onion, Sharbati Wheat, Tomato" autocomplete="off" />
      </div>

      <div class="input-group">
        <label class="input-label" for="nt-initial-msg">Initial Insight / Message *</label>
        <textarea id="nt-initial-msg" class="textarea-control" rows="3" required placeholder="Share what traders are quoting or what you are experiencing in your local mandi..."></textarea>
      </div>

      <div style="margin-top: 1.5rem;">
        <button type="submit" id="nt-submit-btn" class="btn btn-primary" style="width: 100%;">
          Create Discussion Topic
        </button>
      </div>
    </form>
  `;

  openModal({
    title: 'Start Farmer Discussion Topic',
    bodyHtml: modalHtml,
    onOpen: (backdrop, closeModal) => {
      const cropInput = backdrop.querySelector('#nt-crop');
      if (cropInput) {
        setupCropAutocomplete(cropInput, knownCrops);
      }

      const form = backdrop.querySelector('#new-topic-form');
      form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = backdrop.querySelector('#nt-submit-btn');
        const title = backdrop.querySelector('#nt-title').value;
        const cropName = backdrop.querySelector('#nt-crop').value;
        const initialMsg = backdrop.querySelector('#nt-initial-msg').value;

        try {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Creating...';

          const newTopic = await createTopic({
            title,
            cropName,
            creatorId: user.uid,
            creatorName: profile?.displayName || 'Farmer'
          });

          await sendMessage(newTopic.topicId, {
            senderId: user.uid,
            senderName: profile?.displayName || 'Farmer',
            senderPhoto: profile?.photoURL || '',
            text: initialMsg
          });

          showToast('Discussion topic created!', 'success');
          closeModal();
          selectTopic(newTopic.topicId);
        } catch (err) {
          showToast(err.message || 'Error creating topic', 'error');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Create Discussion Topic';
        }
      });
    }
  });
}

export function bindFarmerChatEvents(routerNavigate) {
  document.getElementById('new-topic-btn')?.addEventListener('click', () => {
    openCreateTopicModal();
  });

  const sendForm = document.getElementById('chat-send-form');
  sendForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!activeTopicId) return;

    const user = getCurrentUser();
    const profile = getCurrentProfile();
    const input = document.getElementById('chat-input-field');
    const text = input?.value.trim();
    if (!text || !user) return;

    try {
      input.value = '';
      await sendMessage(activeTopicId, {
        senderId: user.uid,
        senderName: profile?.displayName || 'Farmer',
        senderPhoto: profile?.photoURL || '',
        text
      });
    } catch (err) {
      showToast(err.message || 'Failed to send message', 'error');
    }
  });

  subscribeTopics((topics) => {
    topicsList = topics;
    renderTopicsList();
    if (!activeTopicId && topics.length > 0) {
      selectTopic(topics[0].topicId);
    }
  });
}
