import { getCurrentUser, getCurrentProfile, loginWithGoogle } from '../services/auth-service.js';
import { subscribePriceAnalytics } from '../services/analytics-service.js';
import { formatCurrency } from '../utils.js';
import { showToast } from '../components/toast.js';
import { CropIcons } from '../components/crop-illustrations.js';

export function renderLandingPage() {
  const user = getCurrentUser();
  const profile = getCurrentProfile();

  return `
    <div class="landing-page">
      <section class="landing-hero">
        <div class="container hero-content-relative">
          <div class="hero-pill">
            <span class="pulse-dot"></span>
            Direct Farm-to-Market Realtime Bidding Platform
          </div>

          <h1 class="hero-title">
            Empowering Farmers & Merchants with <span class="brand-highlight">Transparent Pricing</span> & Live Tenders
          </h1>

          <p class="hero-subtitle">
            Eliminate middlemen. List crops with verified market analytics, start reverse auction bidding up to 4 hours, and connect in private farmer discussion boards.
          </p>

          <div class="hero-actions">
            ${user ? `
              ${profile?.role === 'farmer' ? `
                <a href="#/farmer-dashboard" class="btn btn-primary btn-lg">
                  ${CropIcons.farmer} Go to Farmer Dashboard
                </a>
                <a href="#/farmer-chat" class="btn btn-secondary btn-lg">
                  ${CropIcons.sprout} Farmer Mandi Chat
                </a>
              ` : `
                <a href="#/buyer-dashboard" class="btn btn-primary btn-lg">
                  ${CropIcons.tractor} Go to Buyer Dashboard
                </a>
                <a href="#/marketplace" class="btn btn-secondary btn-lg">
                  ${CropIcons.basket} Browse Crops Market
                </a>
              `}
            ` : `
              <button id="hero-google-btn" class="btn btn-primary btn-lg">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z"/></svg>
                Sign In with Google
              </button>
            `}
          </div>
        </div>
      </section>

      ${user ? `
        <div class="market-ticker">
          <div class="ticker-track" id="live-price-ticker">
            <div class="ticker-item"><span style="color: var(--text-tertiary);">Loading live market rates...</span></div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

export function bindLandingEvents(routerNavigate) {
  document.getElementById('hero-google-btn')?.addEventListener('click', async () => {
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

  const tickerContainer = document.getElementById('live-price-ticker');
  if (tickerContainer) {
    subscribePriceAnalytics((analyticsList) => {
      if (!analyticsList || analyticsList.length === 0) {
        tickerContainer.innerHTML = `
          <div class="ticker-item">🌾 Wheat: ₹2,450/quintal</div>
          <div class="ticker-item">🧅 Red Onion: ₹24.00/kg</div>
          <div class="ticker-item">🍅 Tomato: ₹18.50/kg</div>
          <div class="ticker-item">🥔 Potato: ₹16.00/kg</div>
          <div class="ticker-item">🌾 Rice (Basmati): ₹4,800/quintal</div>
        `;
        return;
      }
      tickerContainer.innerHTML = analyticsList.map(a => `
        <div class="ticker-item">
          <span style="color: var(--primary-600); font-weight: 700;">${a.cropName}</span>: 
          <span>Avg ${formatCurrency(a.avgPrice)}/${a.unit || 'kg'}</span> 
          <span style="color: var(--text-tertiary); font-size: 0.78rem;">(Min ${formatCurrency(a.minPrice)} - Max ${formatCurrency(a.maxPrice)})</span>
        </div>
      `).join('');
    });
  }
}
