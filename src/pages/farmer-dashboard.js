import { getCurrentUser, getCurrentProfile } from '../services/auth-service.js';
import { subscribeProducts, createProduct, updateProduct, deleteProduct, getKnownCropNames } from '../services/product-service.js';
import { subscribeTenders } from '../services/tender-service.js';
import { subscribePriceAnalytics } from '../services/analytics-service.js';
import { formatCurrency, formatNumber, getCropImage, fetchWikipediaCropImage, getRemainingTime, escapeHtml } from '../utils.js';
import { openModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { CropIcons, getCropIllustration } from '../components/crop-illustrations.js';
import { setupCropAutocomplete } from '../components/autocomplete.js';

let myProducts = [];
let allTenders = [];
let analyticsData = [];
let timerInterval = null;

export function renderFarmerDashboard() {
  const profile = getCurrentProfile();

  return `
    <div class="container dashboard-layout">
      <div class="page-header">
        <div>
          <div class="page-title-row">
            <h1>Farmer Dashboard</h1>
            <span class="badge badge-primary">Producer Portal</span>
          </div>
          <p class="page-subtitle">
            Welcome back, <strong>${escapeHtml(profile?.displayName || 'Kisan Mitra')}</strong>. Manage your harvest listings and join active buyer tenders.
          </p>
        </div>

        <div class="page-actions-row">
          <button id="add-product-btn" class="btn btn-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            List New Crop
          </button>
          <a href="#/farmer-chat" class="btn btn-secondary">
            Mandi Chat
          </a>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <span class="stat-label">Active Listings</span>
            ${CropIcons.wheat}
          </div>
          <span class="stat-value" id="stat-active-listings">0</span>
          <span class="stat-sub">Crops currently on market</span>
        </div>

        <div class="stat-card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <span class="stat-label">Open Tenders</span>
            ${CropIcons.tractor}
          </div>
          <span class="stat-value" id="stat-open-tenders" style="color: var(--amber-600);">0</span>
          <span class="stat-sub">Live bidding opportunities</span>
        </div>

        <div class="stat-card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <span class="stat-label">Direct Inquiries</span>
            ${CropIcons.basket}
          </div>
          <span class="stat-value" id="stat-direct-inquiries" style="color: var(--primary-600);">0</span>
          <span class="stat-sub">Tenders targeted to you</span>
        </div>

        <div class="stat-card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <span class="stat-label">Your Mandi Region</span>
            ${CropIcons.sun}
          </div>
          <span class="stat-value" style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary); text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
            ${escapeHtml(profile?.location || 'India Mandi')}
          </span>
          <span class="stat-sub">Verified Producer</span>
        </div>
      </div>

      <div class="dashboard-main-grid">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
            <h2 style="font-size: 1.3rem;">My Listed Harvest</h2>
            <span style="font-size: 0.85rem; color: var(--text-tertiary);" id="my-products-count">0 items</span>
          </div>

          <div id="farmer-products-container" class="products-grid">
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-tertiary);">
              Loading your products...
            </div>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
              <div style="display: flex; align-items: center; gap: 0.4rem;">
                <span class="animate-sun">${CropIcons.sun}</span>
                <h3 style="font-size: 1.15rem;">Live Market Price Index</h3>
              </div>
              <span class="pulse-dot"></span>
            </div>
            <p style="font-size: 0.825rem; color: var(--text-secondary); margin-bottom: 1rem;">
              Calculated real-time across all mandi listings to guide your pricing strategy.
            </p>
            <div id="farmer-price-index-list" style="display: flex; flex-direction: column; gap: 0.85rem;">
              <div style="text-align: center; color: var(--text-tertiary); padding: 1.5rem;">Loading price analytics...</div>
            </div>
          </div>

          <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
              <div style="display: flex; align-items: center; gap: 0.4rem;">
                <span class="animate-float">${CropIcons.tractor}</span>
                <h3 style="font-size: 1.15rem;">Live Tenders to Bid On</h3>
              </div>
              <span class="badge badge-amber">Up to 4h Timer</span>
            </div>
            <p style="font-size: 0.825rem; color: var(--text-secondary); margin-bottom: 1rem;">
              Merchants seeking harvest right now. Submit lowest competitive quotes to win.
            </p>
            <div id="farmer-tenders-list" style="display: flex; flex-direction: column; gap: 0.85rem;">
              <div style="text-align: center; color: var(--text-tertiary); padding: 1.5rem;">Loading live tenders...</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function updateStats() {
  const user = getCurrentUser();
  if (!user) return;

  const activeMyProducts = myProducts.filter(p => p.farmerId === user.uid && p.isActive);
  const openTenders = allTenders.filter(t => t.status === 'open' && (t.tenderType === 'open' || t.targetFarmerId === user.uid));
  const directInquiries = allTenders.filter(t => t.status === 'open' && t.targetFarmerId === user.uid);

  const activeEl = document.getElementById('stat-active-listings');
  const tendersEl = document.getElementById('stat-open-tenders');
  const directEl = document.getElementById('stat-direct-inquiries');
  const countEl = document.getElementById('my-products-count');

  if (activeEl) activeEl.textContent = activeMyProducts.length;
  if (tendersEl) tendersEl.textContent = openTenders.length;
  if (directEl) directEl.textContent = directInquiries.length;
  if (countEl) countEl.textContent = `${activeMyProducts.length} active listings`;
}

function renderFarmerProducts() {
  const container = document.getElementById('farmer-products-container');
  if (!container) return;

  const user = getCurrentUser();
  if (!user) return;

  const mine = myProducts.filter(p => p.farmerId === user.uid);

  if (mine.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1.5rem; background: var(--bg-card); border-radius: var(--radius-xl); border: 1px dashed var(--border-medium);">
        <div style="width: 48px; height: 48px; border-radius: var(--radius-full); background: var(--bg-badge); color: var(--primary-600); margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center;">
          <span class="animate-sway">${CropIcons.sprout}</span>
        </div>
        <h3 style="font-size: 1.15rem; margin-bottom: 0.35rem;">No crops listed yet</h3>
        <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 1.25rem;">Start selling directly to bulk merchants by listing your crops with custom pricing.</p>
        <button id="add-first-product-btn" class="btn btn-primary btn-sm">List Your First Crop</button>
      </div>
    `;
    document.getElementById('add-first-product-btn')?.addEventListener('click', () => openAddEditProductModal());
    return;
  }

  container.innerHTML = mine.map(product => {
    const imgUrl = product.imageUrl || getCropImage(product.cropName);
    const illustration = getCropIllustration(product.cropName);

    return `
      <div class="product-card animate-fade-in" data-crop="${escapeHtml(product.cropName)}">
        <div class="product-image-container">
          <img src="${imgUrl}" alt="${escapeHtml(product.cropName)}" class="product-image" loading="lazy" />
          <div class="product-badge-overlay">
            <span class="badge ${product.isActive ? 'badge-primary' : 'badge-neutral'}">
              <span class="animate-sway">${illustration}</span>
              ${product.isActive ? 'Active on Market' : 'Paused'}
            </span>
          </div>
        </div>

        <div class="product-content">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <h3 style="font-size: 1.15rem;">${escapeHtml(product.cropName)}</h3>
            <span style="font-size: 0.8rem; color: var(--text-tertiary);">${product.unit}</span>
          </div>

          <p style="font-size: 0.825rem; color: var(--text-secondary); line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            ${escapeHtml(product.description || 'Fresh harvest ready for sale.')}
          </p>

          <div style="font-size: 0.8rem; color: var(--text-secondary); display: flex; justify-content: space-between;">
            <span>Stock: <strong>${formatNumber(product.availableQuantity)} ${product.unit}</strong></span>
            <span>Min Order: ${product.minOrderQuantity || 1}</span>
          </div>

          <div class="product-price-row">
            <div>
              <div style="font-size: 0.7rem; color: var(--text-tertiary); font-weight: 600;">YOUR PRICE</div>
              <div class="product-price">${formatCurrency(product.pricePerUnit)} <span style="font-size: 0.75rem; font-weight: 500; color: var(--text-secondary);">/ ${product.unit}</span></div>
            </div>

            <div style="display: flex; gap: 0.4rem;">
              <button class="btn btn-secondary btn-sm edit-product-btn" data-id="${product.productId}" title="Edit Listing">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              </button>
              <button class="btn btn-ghost btn-sm delete-product-btn" data-id="${product.productId}" title="Delete Listing" style="color: var(--danger-500);">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  bindFarmerProductActions();

  document.querySelectorAll('#farmer-products-container .product-card[data-crop]').forEach(async card => {
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

function bindFarmerProductActions() {
  document.querySelectorAll('.edit-product-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const prod = myProducts.find(p => p.productId === id);
      if (prod) openAddEditProductModal(prod);
    });
  });

  document.querySelectorAll('.delete-product-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (confirm('Are you sure you want to remove this crop listing?')) {
        try {
          await deleteProduct(id);
          showToast('Product removed', 'info');
        } catch (e) {
          showToast(e.message || 'Error deleting product', 'error');
        }
      }
    });
  });
}

function renderFarmerPriceIndex() {
  const container = document.getElementById('farmer-price-index-list');
  if (!container) return;

  if (analyticsData.length === 0) {
    container.innerHTML = '<div style="text-align: center; color: var(--text-tertiary); padding: 1.5rem; font-size: 0.85rem;">No active market benchmarks yet</div>';
    return;
  }

  container.innerHTML = analyticsData.map(item => {
    const rangeSpan = item.maxPrice - item.minPrice;
    const avgPercent = rangeSpan > 0 ? Math.min(Math.max(((item.avgPrice - item.minPrice) / rangeSpan) * 100, 15), 85) : 50;
    const illustration = getCropIllustration(item.cropName);

    return `
      <div style="background: var(--bg-surface-elevated); padding: 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
          <div style="display: flex; align-items: center; gap: 0.4rem;">
            ${illustration}
            <strong style="font-size: 0.95rem; color: var(--text-primary);">${escapeHtml(item.cropName)}</strong>
          </div>
          <span class="badge badge-primary" style="font-size: 0.7rem;">${item.activeListingsCount} listings</span>
        </div>

        <div style="display: flex; justify-content: space-between; font-size: 0.78rem; color: var(--text-secondary); margin-bottom: 0.35rem;">
          <span>Min: <strong style="color: var(--primary-600);">${formatCurrency(item.minPrice)}</strong></span>
          <span>Avg: <strong style="color: var(--amber-600);">${formatCurrency(item.avgPrice)}</strong></span>
          <span>Max: <strong style="color: var(--danger-500);">${formatCurrency(item.maxPrice)}</strong></span>
        </div>

        <div class="price-range-bar-wrapper" style="margin: 0.4rem 0 0;">
          <div class="price-range-bar-bg">
            <div class="price-range-bar-fill" style="width: ${avgPercent}%;"></div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderFarmerTenders() {
  const container = document.getElementById('farmer-tenders-list');
  if (!container) return;

  const user = getCurrentUser();
  if (!user) return;

  const liveTenders = allTenders.filter(t => t.status === 'open' && (t.tenderType === 'open' || t.targetFarmerId === user.uid));

  if (liveTenders.length === 0) {
    container.innerHTML = '<div style="text-align: center; color: var(--text-tertiary); padding: 1.5rem; font-size: 0.85rem;">No live tenders active right now</div>';
    return;
  }

  container.innerHTML = liveTenders.map(t => {
    const timeState = getRemainingTime(t.expiresAt);
    const isDirect = t.targetFarmerId === user.uid;
    const illustration = getCropIllustration(t.cropName);

    return `
      <div class="tender-card ${isDirect ? 'direct-tender' : 'active-tender'}" style="padding: 0.9rem;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem;">
          <div>
            <div style="display: flex; align-items: center; gap: 0.4rem;">
              <span class="animate-sway">${illustration}</span>
              <strong style="font-size: 1rem;">${escapeHtml(t.cropName)}</strong>
              ${isDirect ? '<span class="badge badge-amber" style="font-size: 0.65rem;">Direct for you</span>' : '<span class="badge badge-primary" style="font-size: 0.65rem;">Open Tender</span>'}
            </div>
            <div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 2px;">
              Buyer: ${escapeHtml(t.buyerName)} (${escapeHtml(t.buyerLocation)})
            </div>
          </div>

          <span class="tender-timer timer-${timeState.state}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            ${timeState.text}
          </span>
        </div>

        <div style="display: flex; justify-content: space-between; font-size: 0.825rem; margin-top: 0.5rem; background: var(--bg-surface-elevated); padding: 0.5rem 0.75rem; border-radius: var(--radius-sm);">
          <span>Qty: <strong>${formatNumber(t.requiredQuantity)} ${t.unit}</strong></span>
          <span>Target: <strong>${formatCurrency(t.targetPricePerUnit)}/${t.unit}</strong></span>
          <span>Best Bid: <strong style="color: var(--primary-600);">${t.currentBestBid ? formatCurrency(t.currentBestBid) : 'None yet'}</strong></span>
        </div>

        <div style="margin-top: 0.65rem; display: flex; justify-content: flex-end;">
          <a href="#/tender/${t.tenderId}" class="btn btn-primary btn-sm" style="width: 100%;">
            Enter Live Bidding Room
          </a>
        </div>
      </div>
    `;
  }).join('');
}

async function openAddEditProductModal(existingProduct = null) {
  const profile = getCurrentProfile();
  const user = getCurrentUser();
  if (!user) return;

  const isEdit = !!existingProduct;
  const knownCrops = await getKnownCropNames();
  const datalistOptions = knownCrops.map(name => `<option value="${escapeHtml(name)}">`).join('');

  const modalHtml = `
    <form id="product-form">
      <div class="input-group">
        <label class="input-label" for="pf-crop-name">Crop / Product Name *</label>
        <input type="text" id="pf-crop-name" class="input-control" required placeholder="e.g. Sharbati Wheat, Red Onion, Basmati Rice" value="${existingProduct ? escapeHtml(existingProduct.cropName) : ''}" autocomplete="off" />
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
        <div class="input-group">
          <label class="input-label" for="pf-price">Your Price (₹) *</label>
          <input type="number" id="pf-price" class="input-control" required min="0.1" step="0.01" placeholder="e.g. 24.50" value="${existingProduct ? existingProduct.pricePerUnit : ''}" />
        </div>

        <div class="input-group">
          <label class="input-label" for="pf-unit">Price Unit *</label>
          <select id="pf-unit" class="select-control">
            <option value="kg" ${existingProduct?.unit === 'kg' ? 'selected' : ''}>Per Kg</option>
            <option value="quintal" ${existingProduct?.unit === 'quintal' ? 'selected' : ''}>Per Quintal (100 kg)</option>
            <option value="item" ${existingProduct?.unit === 'item' ? 'selected' : ''}>Per Item / Piece</option>
            <option value="dozen" ${existingProduct?.unit === 'dozen' ? 'selected' : ''}>Per Dozen</option>
          </select>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
        <div class="input-group">
          <label class="input-label" for="pf-quantity">Available Stock (Quantity) *</label>
          <input type="number" id="pf-quantity" class="input-control" required min="1" step="any" placeholder="e.g. 5000" value="${existingProduct ? existingProduct.availableQuantity : ''}" />
        </div>

        <div class="input-group">
          <label class="input-label" for="pf-min-order">Minimum Order Quantity</label>
          <input type="number" id="pf-min-order" class="input-control" min="1" step="any" placeholder="e.g. 50" value="${existingProduct ? existingProduct.minOrderQuantity : '1'}" />
        </div>
      </div>

      <div class="input-group">
        <label class="input-label" for="pf-desc">Description / Quality Notes</label>
        <textarea id="pf-desc" class="textarea-control" rows="2" placeholder="Grade A quality, organic harvested, warehouse packed...">${existingProduct ? escapeHtml(existingProduct.description || '') : ''}</textarea>
      </div>

      <div class="input-group">
        <label class="input-label" for="pf-image-url">Image URL (Optional - Auto generated if left blank)</label>
        <input type="url" id="pf-image-url" class="input-control" placeholder="https://..." value="${existingProduct ? escapeHtml(existingProduct.imageUrl || '') : ''}" />
      </div>

      <div style="margin-top: 1.5rem;">
        <button type="submit" id="pf-submit-btn" class="btn btn-primary" style="width: 100%;">
          ${isEdit ? 'Save Changes' : 'Publish Crop to Market'}
        </button>
      </div>
    </form>
  `;

  openModal({
    title: isEdit ? 'Edit Harvest Listing' : 'List New Harvest on KisanLink',
    bodyHtml: modalHtml,
    onOpen: (backdrop, closeModal) => {
      const cropInput = backdrop.querySelector('#pf-crop-name');
      if (cropInput) {
        setupCropAutocomplete(cropInput, knownCrops);
      }

      const form = backdrop.querySelector('#product-form');
      form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = backdrop.querySelector('#pf-submit-btn');
        const cropName = backdrop.querySelector('#pf-crop-name').value;
        const pricePerUnit = backdrop.querySelector('#pf-price').value;
        const unit = backdrop.querySelector('#pf-unit').value;
        const availableQuantity = backdrop.querySelector('#pf-quantity').value;
        const minOrderQuantity = backdrop.querySelector('#pf-min-order').value;
        const description = backdrop.querySelector('#pf-desc').value;
        const imageUrl = backdrop.querySelector('#pf-image-url').value;

        try {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Saving...';

          if (isEdit) {
            await updateProduct(existingProduct.productId, {
              cropName,
              pricePerUnit: parseFloat(pricePerUnit),
              unit,
              availableQuantity: parseFloat(availableQuantity),
              minOrderQuantity: parseFloat(minOrderQuantity || 1),
              description,
              imageUrl
            });
            showToast('Harvest listing updated successfully!', 'success');
          } else {
            await createProduct({
              farmerId: user.uid,
              farmerName: profile?.displayName || 'Farmer',
              farmerLocation: profile?.location || 'Local Farm',
              cropName,
              pricePerUnit,
              unit,
              availableQuantity,
              minOrderQuantity,
              description,
              imageUrl
            });
            showToast('Harvest listed on the live marketplace!', 'success');
          }
          closeModal();
        } catch (err) {
          showToast(err.message || 'Error saving product', 'error');
          submitBtn.disabled = false;
          submitBtn.textContent = isEdit ? 'Save Changes' : 'Publish Crop to Market';
        }
      });
    }
  });
}

export function bindFarmerDashboardEvents(routerNavigate) {
  document.getElementById('add-product-btn')?.addEventListener('click', () => {
    openAddEditProductModal();
  });

  subscribeProducts((products) => {
    myProducts = products;
    updateStats();
    renderFarmerProducts();
  });

  subscribeTenders((tenders) => {
    allTenders = tenders;
    updateStats();
    renderFarmerTenders();
  });

  subscribePriceAnalytics((analytics) => {
    analyticsData = analytics;
    renderFarmerPriceIndex();
  });

  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    renderFarmerTenders();
  }, 30000);
}
