import './styles/index.css';
import './styles/components.css';
import './styles/pages.css';
import './styles/animations.css';

import { initAuthListener, subscribeAuth, getCurrentUser, getCurrentProfile, isRegistrationComplete } from './services/auth-service.js';
import { renderNavbar, bindNavbarEvents } from './components/navbar.js';

import { renderLandingPage, bindLandingEvents } from './pages/landing.js';
import { renderRoleSelectPage, bindRoleSelectEvents } from './pages/role-select.js';
import { renderMarketplacePage, bindMarketplaceEvents } from './pages/marketplace.js';
import { renderFarmerDashboard, bindFarmerDashboardEvents } from './pages/farmer-dashboard.js';
import { renderFarmerChatPage, bindFarmerChatEvents } from './pages/farmer-chat.js';
import { renderBuyerDashboard, bindBuyerDashboardEvents } from './pages/buyer-dashboard.js';
import { renderTenderRoomPage, bindTenderRoomEvents } from './pages/tender-room.js';

const appEl = document.getElementById('app');

function getHashRoute() {
  const hash = window.location.hash.slice(1) || '/';
  const clean = hash.startsWith('/') ? hash.slice(1) : hash;
  const parts = clean.split('/');
  return {
    path: parts[0] || '',
    param: parts[1] || null
  };
}

function navigate(route) {
  window.location.hash = `#/${route}`;
}

function renderApp() {
  const { path, param } = getHashRoute();
  const user = getCurrentUser();
  const profile = getCurrentProfile();
  const registered = isRegistrationComplete(profile);

  let activeNavKey = path;
  if (!path) activeNavKey = '';

  let pageHtml = '';
  let bindFn = null;

  if (!user) {
    if (path === 'marketplace') {
      pageHtml = renderMarketplacePage();
      bindFn = () => bindMarketplaceEvents(navigate);
    } else {
      pageHtml = renderLandingPage();
      bindFn = () => bindLandingEvents(navigate);
      activeNavKey = '';
    }
  } else if (!registered) {
    pageHtml = renderRoleSelectPage();
    bindFn = () => bindRoleSelectEvents(navigate);
    activeNavKey = 'role-select';
  } else {
    if (path === 'marketplace') {
      pageHtml = renderMarketplacePage();
      bindFn = () => bindMarketplaceEvents(navigate);
    } else if (path === 'farmer-dashboard' || (path === '' && profile.role === 'farmer')) {
      pageHtml = renderFarmerDashboard();
      bindFn = () => bindFarmerDashboardEvents(navigate);
      activeNavKey = 'farmer-dashboard';
    } else if (path === 'buyer-dashboard' || (path === '' && profile.role === 'buyer')) {
      pageHtml = renderBuyerDashboard();
      bindFn = () => bindBuyerDashboardEvents(navigate);
      activeNavKey = 'buyer-dashboard';
    } else if (path === 'farmer-chat' && profile.role === 'farmer') {
      pageHtml = renderFarmerChatPage();
      bindFn = () => bindFarmerChatEvents(navigate);
    } else if (path === 'tender' && param) {
      pageHtml = renderTenderRoomPage(param);
      bindFn = () => bindTenderRoomEvents(navigate);
    } else if (path === 'role-select') {
      pageHtml = renderRoleSelectPage();
      bindFn = () => bindRoleSelectEvents(navigate);
    } else {
      if (profile.role === 'farmer') {
        pageHtml = renderFarmerDashboard();
        bindFn = () => bindFarmerDashboardEvents(navigate);
        activeNavKey = 'farmer-dashboard';
      } else {
        pageHtml = renderBuyerDashboard();
        bindFn = () => bindBuyerDashboardEvents(navigate);
        activeNavKey = 'buyer-dashboard';
      }
    }
  }

  appEl.innerHTML = `
    ${renderNavbar(activeNavKey)}
    <main style="flex-grow: 1;">
      ${pageHtml}
    </main>
  `;

  bindNavbarEvents(navigate);
  if (bindFn) bindFn();
}

initAuthListener();

subscribeAuth(() => {
  renderApp();
});

window.addEventListener('hashchange', () => {
  renderApp();
});
