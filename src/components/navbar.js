import { getCurrentUser, getCurrentProfile, loginWithGoogle } from '../services/auth-service.js';
import { showToast } from './toast.js';
import { subscribeUserNotifications, markNotificationRead } from '../services/notification-service.js';
import { CropIcons } from './crop-illustrations.js';
import { openAccountModal } from './account-modal.js';

let notificationsList = [];
let notifUnsub = null;

export function renderNavbar(activeRoute = '') {
  const user = getCurrentUser();
  const profile = getCurrentProfile();
  const role = profile?.role;

  if (user && !notifUnsub) {
    notifUnsub = subscribeUserNotifications(user.uid, (notifs) => {
      notificationsList = notifs;
      updateNotifBadge();
    });
  }

  let navLinksHtml = '';
  let mobileNavHtml = '';

  if (role === 'farmer') {
    navLinksHtml = `
      <a href="#/farmer-dashboard" class="nav-link ${activeRoute === 'farmer-dashboard' ? 'active' : ''}">
        <span class="animate-sway">${CropIcons.wheat}</span>
        Dashboard
      </a>
      <a href="#/marketplace" class="nav-link ${activeRoute === 'marketplace' ? 'active' : ''}">
        <span class="animate-float">${CropIcons.basket}</span>
        Marketplace
      </a>
      <a href="#/farmer-chat" class="nav-link ${activeRoute === 'farmer-chat' ? 'active' : ''}">
        ${CropIcons.sprout}
        Farmer Mandi Chat
      </a>
    `;

    mobileNavHtml = `
      <div class="mobile-nav-bar">
        <a href="#/farmer-dashboard" class="mobile-nav-item ${activeRoute === 'farmer-dashboard' ? 'active' : ''}">
          ${CropIcons.wheat}
          Dashboard
        </a>
        <a href="#/marketplace" class="mobile-nav-item ${activeRoute === 'marketplace' ? 'active' : ''}">
          ${CropIcons.basket}
          Market
        </a>
        <a href="#/farmer-chat" class="mobile-nav-item ${activeRoute === 'farmer-chat' ? 'active' : ''}">
          ${CropIcons.sprout}
          Mandi Chat
        </a>
      </div>
    `;
  } else if (role === 'buyer') {
    navLinksHtml = `
      <a href="#/buyer-dashboard" class="nav-link ${activeRoute === 'buyer-dashboard' ? 'active' : ''}">
        ${CropIcons.tractor}
        Dashboard
      </a>
      <a href="#/marketplace" class="nav-link ${activeRoute === 'marketplace' ? 'active' : ''}">
        <span class="animate-float">${CropIcons.basket}</span>
        Crops Market
      </a>
    `;

    mobileNavHtml = `
      <div class="mobile-nav-bar">
        <a href="#/buyer-dashboard" class="mobile-nav-item ${activeRoute === 'buyer-dashboard' ? 'active' : ''}">
          ${CropIcons.tractor}
          Dashboard
        </a>
        <a href="#/marketplace" class="mobile-nav-item ${activeRoute === 'marketplace' ? 'active' : ''}">
          ${CropIcons.basket}
          Market
        </a>
      </div>
    `;
  } else {
    navLinksHtml = `
      <a href="#/marketplace" class="nav-link ${activeRoute === 'marketplace' ? 'active' : ''}">
        <span class="animate-float">${CropIcons.sprout}</span>
        Live Crops Market
      </a>
    `;
  }

  const unreadCount = notificationsList.filter(n => !n.isRead).length;

  return `
    <nav class="navbar">
      <div class="container navbar-inner">
        <a href="#/" class="brand-logo">
          <img src="/farmer.svg" alt="Farmer" width="24" height="24" class="brand-logo-img" />
          <span><span class="brand-green">Kisan</span><span class="brand-dark">Link</span></span>
        </a>

        <div class="nav-links">
          ${navLinksHtml}
        </div>

        <div class="nav-actions">
          ${user ? `
            <div style="position: relative;">
              <button id="notif-btn" class="btn-icon" aria-label="Notifications" style="position: relative;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                ${unreadCount > 0 ? `<span id="notif-count-badge" style="position: absolute; top: -4px; right: -4px; background: var(--danger-500); color: #fff; font-size: 0.65rem; font-weight: 800; border-radius: 9999px; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center;">${unreadCount}</span>` : ''}
              </button>
              <div id="notif-dropdown" style="display: none; position: absolute; right: 0; top: 48px; width: 290px; max-width: calc(100vw - 2rem); background: var(--bg-surface); border: 1px solid var(--border-medium); border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); z-index: 100; overflow: hidden;">
                <div style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-subtle); font-weight: 700; font-size: 0.85rem; display: flex; justify-content: space-between;">
                  <span>Notifications</span>
                  <span style="color: var(--text-tertiary); font-weight: 500;">${unreadCount} unread</span>
                </div>
                <div id="notif-items-list" style="max-height: 260px; overflow-y: auto;">
                  ${renderNotifsHtml(notificationsList)}
                </div>
              </div>
            </div>

            <button id="user-profile-btn" class="btn-icon" title="Account Settings" style="position: relative;">
              ${user.photoURL ? `
                <img src="${user.photoURL}" alt="${user.displayName || 'User'}" style="width: 32px; height: 32px; border-radius: var(--radius-full); object-fit: cover; border: 2px solid var(--primary-500);" />
              ` : `
                <div style="width: 32px; height: 32px; border-radius: var(--radius-full); background: linear-gradient(135deg, var(--primary-500), var(--primary-700)); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.9rem;">${(user.displayName || 'U').charAt(0).toUpperCase()}</div>
              `}
            </button>
          ` : `
            <button id="google-login-btn" class="btn btn-primary btn-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z"/></svg>
              Sign In
            </button>
          `}
        </div>
      </div>
    </nav>
    ${mobileNavHtml}
  `;
}

function renderNotifsHtml(notifs) {
  if (!notifs || notifs.length === 0) {
    return '<div style="padding: 1.5rem; text-align: center; color: var(--text-tertiary); font-size: 0.85rem;">No notifications yet</div>';
  }
  return notifs.slice(0, 8).map(n => `
    <div class="notif-row" data-id="${n.notificationId}" style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-subtle); cursor: pointer; background: ${n.isRead ? 'transparent' : 'var(--bg-badge)'};">
      <div style="font-weight: 600; font-size: 0.825rem; color: var(--text-primary);">${n.title}</div>
      <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">${n.body}</div>
    </div>
  `).join('');
}

function updateNotifBadge() {
  const badge = document.getElementById('notif-count-badge');
  const items = document.getElementById('notif-items-list');
  const unread = notificationsList.filter(n => !n.isRead).length;
  if (badge) {
    badge.textContent = unread;
    badge.style.display = unread > 0 ? 'flex' : 'none';
  }
  if (items) {
    items.innerHTML = renderNotifsHtml(notificationsList);
  }
}

export function bindNavbarEvents(routerNavigate) {
  document.getElementById('google-login-btn')?.addEventListener('click', async () => {
    try {
      const res = await loginWithGoogle();
      showToast(`Welcome, ${res.user.displayName}!`, 'success');
      if (!res.profile || !res.profile.role) {
        routerNavigate('role-select');
      } else {
        routerNavigate(res.profile.role === 'farmer' ? 'farmer-dashboard' : 'buyer-dashboard');
      }
    } catch (e) {
      showToast(e.message || 'Login failed', 'error');
    }
  });


  document.getElementById('user-profile-btn')?.addEventListener('click', () => {
    openAccountModal(routerNavigate);
  });



  const notifBtn = document.getElementById('notif-btn');
  const notifDropdown = document.getElementById('notif-dropdown');
  if (notifBtn && notifDropdown) {
    notifBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notifDropdown.style.display = notifDropdown.style.display === 'none' ? 'block' : 'none';
    });

    document.addEventListener('click', () => {
      notifDropdown.style.display = 'none';
    });
  }

  document.querySelectorAll('.notif-row').forEach(row => {
    row.addEventListener('click', async () => {
      const id = row.getAttribute('data-id');
      const user = getCurrentUser();
      if (user && id) {
        await markNotificationRead(user.uid, id);
      }
    });
  });
}
