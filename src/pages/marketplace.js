import { subscribeProducts } from '../services/product-service.js';
import { subscribePriceAnalytics } from '../services/analytics-service.js';
import { getCurrentUser, getCurrentProfile } from '../services/auth-service.js';
import { formatCurrency, formatNumber, getCropImage, fetchWikipediaCropImage, escapeHtml } from '../utils.js';
import { openModal } from '../components/modal.js';
import { createTender } from '../services/tender-service.js';
import { showToast } from '../components/toast.js';
import { CropIcons, getCropIllustration } from '../components/crop-illustrations.js';

let productsList = [];
let analyticsList = [];
let searchQuery = '';

export function renderMarketplacePage() {
  const profile = getCurrentProfile();

  return `
    <div class="container dashboard-layout">
      <div class="page-header">
        <div>
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
            <span class="animate-sway">${CropIcons.basket}</span>
            <h1 style="font-size: 2rem;">Live Agricultural Market</h1>
          </div>
          <p style="color: var(--text-secondary); font-size: 0.95rem;">
            Real-time crop supplies direct from verified farmers across regions.
          </p>
        </div>

        <div style="display: flex; gap: 0.75rem; width: 100%; max-width: 420px;">
          <div class="search-box">
            <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" id="market-search-input" class="input-control" placeholder="Search crop, farmer or location..." value="${escapeHtml(searchQuery)}" />
          </div>
        </div>
      </div>

      <div id="analytics-summary-banner" style="margin-bottom: 2rem;"></div>

      <div id="marketplace-products-grid" class="products-grid">
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem; color: var(--text-tertiary);">
          <span class="animate-float">${CropIcons.sprout}</span>
          <div style="margin-top: 0.5rem;">Loading harvest listings...</div>
        </div>
      </div>
    </div>
  `;
}

function renderAnalyticsBanner() {
  const container = document.getElementById('analytics-summary-banner');
  if (!container) return;

  if (analyticsList.length === 0) {
    container.innerHTML = '';
    return;
  }

  const topItems = analyticsList.slice(0, 4);
  container.innerHTML = `
    <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 1.25rem; box-shadow: var(--shadow-sm);">
      <div style="font-weight: 700; font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
        <span class="animate-sun">${CropIcons.sun}</span>
        Live Mandi Price Benchmarks
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        ${topItems.map(item => `
          <div style="background: var(--bg-surface-elevated); padding: 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); display: flex; align-items: center; gap: 0.75rem;">
            <div style="width: 38px; height: 38px; border-radius: var(--radius-full); background: #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-sm);">
              ${getCropIllustration(item.cropName)}
            </div>
            <div>
              <div style="font-weight: 700; color: var(--text-primary); font-size: 0.95rem;">${item.cropName}</div>
              <div style="color: var(--primary-600); font-weight: 800; font-size: 1.15rem; font-family: var(--font-heading);">${formatCurrency(item.avgPrice)} <span style="font-size: 0.75rem; font-weight: 600; color: var(--text-tertiary);">/ ${item.unit || 'kg'}</span></div>
              <div style="font-size: 0.72rem; color: var(--text-tertiary);">
                Range: ${formatCurrency(item.minPrice)} - ${formatCurrency(item.maxPrice)}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderProductsGrid() {
  const container = document.getElementById('marketplace-products-grid');
  if (!container) return;

  const q = searchQuery.toLowerCase().trim();
  const filtered = productsList.filter(p => {
    if (!p.isActive) return false;
    if (!q) return true;
    const matchName = (p.cropName || '').toLowerCase().includes(q);
    const matchFarmer = (p.farmerName || '').toLowerCase().includes(q);
    const matchLoc = (p.farmerLocation || '').toLowerCase().includes(q);
    const matchDesc = (p.description || '').toLowerCase().includes(q);
    return matchName || matchFarmer || matchLoc || matchDesc;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 2rem; background: var(--bg-card); border-radius: var(--radius-xl); border: 1px solid var(--border-subtle);">
        <div style="width: 56px; height: 56px; border-radius: var(--radius-full); background: var(--bg-surface-elevated); margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center; color: var(--text-tertiary);">
          <span class="animate-sway">${CropIcons.sprout}</span>
        </div>
        <h3 style="font-size: 1.25rem; margin-bottom: 0.5rem;">No crops found</h3>
        <p style="color: var(--text-secondary); font-size: 0.9rem;">Try adjusting your search query or check back as farmers list fresh harvest.</p>
      </div>
    `;
    return;
  }

  const profile = getCurrentProfile();

  container.innerHTML = filtered.map(product => {
    const imgUrl = product.imageUrl || getCropImage(product.cropName);
    const matchingAnalytics = analyticsList.find(a => a.cropKey === product.cropKey);
    const illustration = getCropIllustration(product.cropName);

    return `
      <div class="product-card animate-fade-in" data-crop="${escapeHtml(product.cropName)}">
        <div class="product-image-container">
          <img src="${imgUrl}" alt="${escapeHtml(product.cropName)}" class="product-image" loading="lazy" />
          <div class="product-badge-overlay">
            <span class="badge badge-primary">
              <span class="animate-sway">${illustration}</span>
              Direct Farm
            </span>
          </div>
        </div>

        <div class="product-content">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem;">
            <div>
              <h3 style="font-size: 1.2rem; margin-bottom: 0.2rem; display: flex; align-items: center; gap: 0.4rem;">
                ${escapeHtml(product.cropName)}
              </h3>
              <div style="font-size: 0.8rem; color: var(--text-secondary); display: flex; align-items: center; gap: 0.35rem;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                ${escapeHtml(product.farmerName)}
              </div>
            </div>
            <span class="badge badge-neutral" style="font-size: 0.72rem;">${escapeHtml(product.farmerLocation || 'Local Farm')}</span>
          </div>

          <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            ${escapeHtml(product.description || 'Fresh harvest ready for bulk or direct procurement.')}
          </p>

          <div style="font-size: 0.825rem; color: var(--text-tertiary); display: flex; justify-content: space-between; margin-top: 0.25rem;">
            <span>Stock: <strong style="color: var(--text-primary);">${formatNumber(product.availableQuantity)} ${product.unit}</strong></span>
            <span>Min Order: ${product.minOrderQuantity || 1} ${product.unit}</span>
          </div>

          ${matchingAnalytics ? `
            <div style="font-size: 0.75rem; background: var(--bg-surface-elevated); padding: 0.4rem 0.6rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); color: var(--text-secondary);">
              Market Avg: <strong style="color: var(--primary-600);">${formatCurrency(matchingAnalytics.avgPrice)}</strong> (Min ${formatCurrency(matchingAnalytics.minPrice)} - Max ${formatCurrency(matchingAnalytics.maxPrice)})
            </div>
          ` : ''}

          <div class="product-price-row">
            <div>
              <div style="font-size: 0.72rem; color: var(--text-tertiary); font-weight: 600; text-transform: uppercase;">Farmer Price</div>
              <div class="product-price">${formatCurrency(product.pricePerUnit)} <span style="font-size: 0.8rem; font-weight: 500; color: var(--text-secondary);">/ ${product.unit}</span></div>
            </div>

            ${profile?.role === 'buyer' ? `
              <button class="btn btn-amber btn-sm direct-bid-btn" data-product-id="${product.productId}" data-farmer-id="${product.farmerId}" data-farmer-name="${escapeHtml(product.farmerName)}" data-crop-name="${escapeHtml(product.cropName)}" data-unit="${product.unit}" data-price="${product.pricePerUnit}">
                Bid to Farmer
              </button>
            ` : `
              <a href="#/role-select" class="btn btn-secondary btn-sm">
                Inquire
              </a>
            `}
          </div>
        </div>
      </div>
    `;
  }).join('');

  bindProductCardButtons();

  document.querySelectorAll('.product-card[data-crop]').forEach(async card => {
    const cropName = card.getAttribute('data-crop');
    const imgEl = card.querySelector('.product-image');
    if (imgEl && imgEl.src.startsWith('data:image/svg')) {
      const wikiUrl = await fetchWikipediaCropImage(cropName);
      if (wikiUrl && imgEl) {
        imgEl.src = wikiUrl;
      }
    }
  });
}

function bindProductCardButtons() {
  document.querySelectorAll('.direct-bid-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const farmerId = btn.getAttribute('data-farmer-id');
      const farmerName = btn.getAttribute('data-farmer-name');
      const cropName = btn.getAttribute('data-crop-name');
      const unit = btn.getAttribute('data-unit');
      const basePrice = btn.getAttribute('data-price');
      openDirectBidModal({ farmerId, farmerName, cropName, unit, basePrice });
    });
  });
}

function openDirectBidModal({ farmerId, farmerName, cropName, unit, basePrice }) {
  const profile = getCurrentProfile();
  const user = getCurrentUser();
  if (!user || profile?.role !== 'buyer') {
    showToast('Only merchants/buyers can initiate tenders', 'error');
    return;
  }

  const modalHtml = `
    <form id="direct-tender-form">
      <div style="background: var(--bg-badge); padding: 0.85rem; border-radius: var(--radius-md); margin-bottom: 1.25rem; border: 1px solid rgba(22, 163, 74, 0.2);">
        <div style="font-size: 0.85rem; color: var(--primary-700); font-weight: 700;">Direct Tender to ${farmerName}</div>
        <div style="font-size: 0.8rem; color: var(--text-secondary);">Target Crop: <strong>${cropName}</strong> (Listed at ₹${basePrice}/${unit})</div>
      </div>

      <div class="input-group">
        <label class="input-label" for="dt-qty">Required Quantity (${unit}) *</label>
        <input type="number" id="dt-qty" class="input-control" required min="1" step="any" placeholder="e.g. 500" />
      </div>

      <div class="input-group">
        <label class="input-label" for="dt-target-price">Your Target Price Per ${unit} (₹) *</label>
        <input type="number" id="dt-target-price" class="input-control" required min="0.5" step="0.01" value="${basePrice}" />
      </div>

      <div class="input-group">
        <label class="input-label" for="dt-duration">Tender Duration (Live Bidding Timer) *</label>
        <select id="dt-duration" class="select-control">
          <option value="15">15 Minutes</option>
          <option value="30">30 Minutes</option>
          <option value="60" selected>1 Hour</option>
          <option value="120">2 Hours</option>
          <option value="240">4 Hours (Max Limit)</option>
        </select>
      </div>

      <div class="input-group">
        <label class="input-label" for="dt-desc">Specifications / Quality Requirement</label>
        <textarea id="dt-desc" class="textarea-control" rows="3" placeholder="Specify packaging, delivery terms, moisture level..."></textarea>
      </div>

      <div style="margin-top: 1.5rem;">
        <button type="submit" id="dt-submit-btn" class="btn btn-primary" style="width: 100%;">
          Launch Direct Tender
        </button>
      </div>
    </form>
  `;

  openModal({
    title: `Direct Tender: ${cropName}`,
    bodyHtml: modalHtml,
    onOpen: (backdrop, closeModal) => {
      const form = backdrop.querySelector('#direct-tender-form');
      form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = backdrop.querySelector('#dt-submit-btn');
        const qty = backdrop.querySelector('#dt-qty').value;
        const targetPrice = backdrop.querySelector('#dt-target-price').value;
        const duration = backdrop.querySelector('#dt-duration').value;
        const desc = backdrop.querySelector('#dt-desc').value;

        try {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Creating Tender...';

          const tenderPayload = {
            buyerId: user.uid,
            buyerName: profile.displayName || profile.businessName || 'Merchant',
            buyerLocation: profile.location || 'Market Mandi',
            tenderType: 'direct',
            targetFarmerId: farmerId,
            targetFarmerName: farmerName,
            cropName,
            requiredQuantity: qty,
            unit,
            targetPricePerUnit: targetPrice,
            durationMinutes: parseInt(duration),
            description: desc
          };

          const res = await createTender(tenderPayload);
          showToast(`Direct tender created successfully for ${cropName}!`, 'success');
          closeModal();
          window.location.hash = `#/tender/${res.tenderId}`;
        } catch (err) {
          showToast(err.message || 'Failed to create tender', 'error');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Launch Direct Tender';
        }
      });
    }
  });
}

export function bindMarketplaceEvents(routerNavigate) {
  const searchInput = document.getElementById('market-search-input');
  searchInput?.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderProductsGrid();
  });

  subscribeProducts((products) => {
    productsList = products;
    renderProductsGrid();
  });

  subscribePriceAnalytics((analytics) => {
    analyticsList = analytics;
    renderAnalyticsBanner();
    renderProductsGrid();
  });
}
