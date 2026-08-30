import { getCurrentUser, getCurrentProfile } from '../services/auth-service.js';
import { subscribeTenders, createTender } from '../services/tender-service.js';
import { getKnownCropNames } from '../services/product-service.js';
import { formatCurrency, formatNumber, getRemainingTime, escapeHtml } from '../utils.js';
import { openModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { CropIcons, getCropIllustration } from '../components/crop-illustrations.js';
import { setupCropAutocomplete } from '../components/autocomplete.js';

let allTendersList = [];
let timerInterval = null;

export function renderBuyerDashboard() {
  const profile = getCurrentProfile();

  return `
    <div class="container dashboard-layout">
      <div class="page-header">
        <div>
          <div class="page-title-row">
            <h1>Buyer & Merchant Hub</h1>
            <span class="badge badge-amber">Merchant Portal</span>
          </div>
          <p class="page-subtitle">
            Welcome, <strong>${escapeHtml(profile?.businessName || profile?.displayName || 'Merchant')}</strong>. Launch dynamic reverse auction tenders and procure directly from verified farmers.
          </p>
        </div>

        <div class="page-actions-row">
          <button id="create-open-tender-btn" class="btn btn-amber">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Start Open Tender (Up to 4h)
          </button>
          <a href="#/marketplace" class="btn btn-secondary">
            Browse Crops
          </a>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <span class="stat-label">Active Tenders</span>
            ${CropIcons.tractor}
          </div>
          <span class="stat-value" id="buyer-stat-active-tenders" style="color: var(--amber-600);">0</span>
          <span class="stat-sub">Live countdown running</span>
        </div>

        <div class="stat-card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <span class="stat-label">Total Bids Received</span>
            ${CropIcons.wheat}
          </div>
          <span class="stat-value" id="buyer-stat-total-bids" style="color: var(--primary-600);">0</span>
          <span class="stat-sub">Farmer quotes received</span>
        </div>

        <div class="stat-card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <span class="stat-label">Procured / Awarded</span>
            ${CropIcons.sun}
          </div>
          <span class="stat-value" id="buyer-stat-awarded">0</span>
          <span class="stat-sub">Completed transactions</span>
        </div>

        <div class="stat-card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <span class="stat-label">Procurement Hub</span>
            ${CropIcons.basket}
          </div>
          <span class="stat-value" style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary); text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
            ${escapeHtml(profile?.location || 'Central Mandi')}
          </span>
          <span class="stat-sub">Verified Merchant</span>
        </div>
      </div>

      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
          <h2 style="font-size: 1.3rem;">My Procurement Tenders</h2>
          <span style="font-size: 0.85rem; color: var(--text-tertiary);" id="buyer-tenders-count">0 tenders</span>
        </div>

        <div id="buyer-tenders-container" style="display: grid; grid-template-columns: 1fr; gap: 1.25rem;">
          <div style="text-align: center; padding: 4rem; color: var(--text-tertiary);">
            Loading your tenders...
          </div>
        </div>
      </div>
    </div>
  `;
}

function updateBuyerStats() {
  const user = getCurrentUser();
  if (!user) return;

  const mine = allTendersList.filter(t => t.buyerId === user.uid);
  const activeTenders = mine.filter(t => t.status === 'open' && t.expiresAt > Date.now());
  const awardedTenders = mine.filter(t => t.status === 'awarded');
  const totalBids = mine.reduce((sum, t) => sum + (t.bidCount || 0), 0);

  const activeEl = document.getElementById('buyer-stat-active-tenders');
  const bidsEl = document.getElementById('buyer-stat-total-bids');
  const awardedEl = document.getElementById('buyer-stat-awarded');
  const countEl = document.getElementById('buyer-tenders-count');

  if (activeEl) activeEl.textContent = activeTenders.length;
  if (bidsEl) bidsEl.textContent = totalBids;
  if (awardedEl) awardedEl.textContent = awardedTenders.length;
  if (countEl) countEl.textContent = `${mine.length} total tenders`;
}

function renderBuyerTenders() {
  const container = document.getElementById('buyer-tenders-container');
  if (!container) return;

  const user = getCurrentUser();
  if (!user) return;

  const mine = allTendersList.filter(t => t.buyerId === user.uid);

  if (mine.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 4rem 2rem; background: var(--bg-card); border-radius: var(--radius-xl); border: 1px dashed var(--border-medium);">
        <div style="width: 56px; height: 56px; border-radius: var(--radius-full); background: rgba(245, 158, 11, 0.15); color: var(--amber-500); margin: 0 auto 1.25rem; display: flex; align-items: center; justify-content: center;">
          <span class="animate-float">${CropIcons.basket}</span>
        </div>
        <h3 style="font-size: 1.25rem; margin-bottom: 0.5rem;">No tenders created yet</h3>
        <p style="color: var(--text-secondary); font-size: 0.9rem; max-width: 500px; margin: 0 auto 1.5rem;">
          Start a timed tender (up to 4 hours) to receive competitive bids from farmers across the region.
        </p>
        <button id="create-first-tender-btn" class="btn btn-amber">Launch Your First Tender</button>
      </div>
    `;
    document.getElementById('create-first-tender-btn')?.addEventListener('click', () => openCreateTenderModal());
    return;
  }

  container.innerHTML = mine.map(tender => {
    const timeState = getRemainingTime(tender.expiresAt);
    const isOpen = tender.status === 'open' && !timeState.expired;
    const isAwarded = tender.status === 'awarded';
    const illustration = getCropIllustration(tender.cropName);

    let statusBadge = '';
    if (isAwarded) {
      statusBadge = '<span class="badge badge-primary">Awarded / Won</span>';
    } else if (isOpen) {
      statusBadge = `<span class="tender-timer timer-${timeState.state}">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
        ${timeState.text}
      </span>`;
    } else {
      statusBadge = '<span class="badge badge-neutral">Tender Ended</span>';
    }

    return `
      <div class="card animate-fade-in" style="display: flex; flex-direction: column; gap: 1rem; border-left: 4px solid ${isOpen ? 'var(--amber-500)' : (isAwarded ? 'var(--primary-500)' : 'var(--border-medium)')};">
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.5rem;">
            <div>
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span class="animate-sway">${illustration}</span>
                <h3 style="font-size: 1.3rem;">${escapeHtml(tender.cropName)}</h3>
                <span class="badge ${tender.tenderType === 'direct' ? 'badge-amber' : 'badge-primary'}" style="font-size: 0.7rem;">
                  ${tender.tenderType === 'direct' ? `Direct to ${escapeHtml(tender.targetFarmerName || 'Farmer')}` : 'Open Mandi Tender'}
                </span>
              </div>
              <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 2px;">
                ${escapeHtml(tender.description || 'Standard quality required.')}
              </p>
            </div>
            ${statusBadge}
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.75rem; background: var(--bg-surface-elevated); padding: 0.85rem 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); margin-top: 0.25rem;">
            <div>
              <div style="font-size: 0.72rem; color: var(--text-tertiary); font-weight: 600; text-transform: uppercase;">Required Qty</div>
              <div style="font-size: 1.1rem; font-weight: 800; font-family: var(--font-heading);">${formatNumber(tender.requiredQuantity)} ${tender.unit}</div>
            </div>

            <div>
              <div style="font-size: 0.72rem; color: var(--text-tertiary); font-weight: 600; text-transform: uppercase;">Your Target Price</div>
              <div style="font-size: 1.1rem; font-weight: 800; font-family: var(--font-heading);">${formatCurrency(tender.targetPricePerUnit)} <span style="font-size: 0.75rem; font-weight: 500; color: var(--text-secondary);">/ ${tender.unit}</span></div>
            </div>

            <div>
              <div style="font-size: 0.72rem; color: var(--text-tertiary); font-weight: 600; text-transform: uppercase;">Best Farmer Bid</div>
              <div style="font-size: 1.1rem; font-weight: 800; font-family: var(--font-heading); color: ${tender.currentBestBid ? 'var(--primary-600)' : 'var(--text-tertiary)'};">
                ${tender.currentBestBid ? `${formatCurrency(tender.currentBestBid)} / ${tender.unit}` : 'No bids yet'}
              </div>
            </div>

            <div>
              <div style="font-size: 0.72rem; color: var(--text-tertiary); font-weight: 600; text-transform: uppercase;">Live Bids Count</div>
              <div style="font-size: 1.1rem; font-weight: 800; font-family: var(--font-heading); color: var(--amber-600);">${tender.bidCount || 0} Quotes</div>
            </div>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-subtle); padding-top: 0.75rem;">
          <span style="font-size: 0.78rem; color: var(--text-tertiary);">
            Duration: ${tender.durationMinutes} min limit
          </span>

          <a href="#/tender/${tender.tenderId}" class="btn btn-primary btn-sm">
            Enter Live Auction Room →
          </a>
        </div>
      </div>
    `;
  }).join('');
}

async function openCreateTenderModal() {
  const profile = getCurrentProfile();
  const user = getCurrentUser();
  if (!user) return;

  const knownCrops = await getKnownCropNames();
  const datalistOptions = knownCrops.map(name => `<option value="${escapeHtml(name)}">`).join('');

  const modalHtml = `
    <form id="create-open-tender-form">
      <div class="input-group">
        <label class="input-label" for="cot-crop">Crop / Commodity Name *</label>
        <input type="text" id="cot-crop" class="input-control" required placeholder="e.g. Red Onion, Sharbati Wheat, Basmati Rice, Tomato" autocomplete="off" />
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
        <div class="input-group">
          <label class="input-label" for="cot-qty">Required Quantity *</label>
          <input type="number" id="cot-qty" class="input-control" required min="1" step="any" placeholder="e.g. 2500" />
        </div>

        <div class="input-group">
          <label class="input-label" for="cot-unit">Quantity Unit *</label>
          <select id="cot-unit" class="select-control">
            <option value="kg">Kg</option>
            <option value="quintal" selected>Quintal (100 kg)</option>
            <option value="item">Item / Piece</option>
            <option value="dozen">Dozen</option>
          </select>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
        <div class="input-group">
          <label class="input-label" for="cot-target-price">Target Price (₹ per unit) *</label>
          <input type="number" id="cot-target-price" class="input-control" required min="0.1" step="0.01" placeholder="e.g. 2400.00" />
        </div>

        <div class="input-group">
          <label class="input-label" for="cot-duration">Tender Duration *</label>
          <select id="cot-duration" class="select-control">
            <option value="15">15 Minutes (Flash Tender)</option>
            <option value="30">30 Minutes</option>
            <option value="60" selected>1 Hour</option>
            <option value="120">2 Hours</option>
            <option value="240">4 Hours (Max Limit)</option>
          </select>
        </div>
      </div>

      <div class="input-group">
        <label class="input-label" for="cot-desc">Procurement Specifications / Notes</label>
        <textarea id="cot-desc" class="textarea-control" rows="2" placeholder="State delivery terms, moisture percentage, packaging specifications..."></textarea>
      </div>

      <div style="margin-top: 1.5rem;">
        <button type="submit" id="cot-submit-btn" class="btn btn-amber" style="width: 100%;">
          Launch Open Mandi Tender
        </button>
      </div>
    </form>
  `;

  openModal({
    title: 'Launch Live Procurement Tender',
    bodyHtml: modalHtml,
    onOpen: (backdrop, closeModal) => {
      const cropInput = backdrop.querySelector('#cot-crop');
      if (cropInput) {
        setupCropAutocomplete(cropInput, knownCrops);
      }

      const form = backdrop.querySelector('#create-open-tender-form');
      form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = backdrop.querySelector('#cot-submit-btn');
        const cropName = backdrop.querySelector('#cot-crop').value;
        const requiredQuantity = backdrop.querySelector('#cot-qty').value;
        const unit = backdrop.querySelector('#cot-unit').value;
        const targetPricePerUnit = backdrop.querySelector('#cot-target-price').value;
        const durationMinutes = backdrop.querySelector('#cot-duration').value;
        const description = backdrop.querySelector('#cot-desc').value;

        try {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Launching Tender...';

          const res = await createTender({
            buyerId: user.uid,
            buyerName: profile?.businessName || profile?.displayName || 'Merchant',
            buyerLocation: profile?.location || 'Central Mandi',
            tenderType: 'open',
            targetFarmerId: null,
            cropName,
            requiredQuantity,
            unit,
            targetPricePerUnit,
            durationMinutes: parseInt(durationMinutes),
            description
          });

          showToast(`Live tender for ${cropName} is now active!`, 'success');
          closeModal();
          window.location.hash = `#/tender/${res.tenderId}`;
        } catch (err) {
          showToast(err.message || 'Error launching tender', 'error');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Launch Open Mandi Tender';
        }
      });
    }
  });
}

export function bindBuyerDashboardEvents(routerNavigate) {
  document.getElementById('create-open-tender-btn')?.addEventListener('click', () => {
    openCreateTenderModal();
  });

  subscribeTenders((tenders) => {
    allTendersList = tenders;
    updateBuyerStats();
    renderBuyerTenders();
  });

  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    renderBuyerTenders();
  }, 15000);
}
