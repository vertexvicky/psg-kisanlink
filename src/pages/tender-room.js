import { getCurrentUser, getCurrentProfile } from '../services/auth-service.js';
import { subscribeSingleTender, subscribeTenderBids, placeBid, awardTender, closeTender } from '../services/tender-service.js';
import { formatCurrency, formatNumber, getRemainingTime, timeAgo, escapeHtml } from '../utils.js';
import { showToast } from '../components/toast.js';
import confetti from 'canvas-confetti';

let currentTenderId = null;
let currentTenderData = null;
let currentBidsList = [];
let tenderUnsub = null;
let bidsUnsub = null;
let liveTimerInterval = null;

export function renderTenderRoomPage(tenderId) {
  currentTenderId = tenderId;

  return `
    <div class="container dashboard-layout">
      <div style="margin-bottom: 1.5rem;">
        <a href="javascript:history.back()" class="btn btn-ghost btn-sm" style="display: inline-flex; align-items: center; gap: 0.35rem; margin-bottom: 0.5rem;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Back to Dashboard
        </a>
      </div>

      <div id="tender-room-content">
        <div style="text-align: center; padding: 4rem; color: var(--text-tertiary);">
          Connecting to live tender room...
        </div>
      </div>
    </div>
  `;
}

function renderLiveRoom() {
  const container = document.getElementById('tender-room-content');
  if (!container || !currentTenderData) return;

  const t = currentTenderData;
  const user = getCurrentUser();
  const profile = getCurrentProfile();
  const isBuyerOwner = user && t.buyerId === user.uid;
  const isFarmer = profile?.role === 'farmer';

  const timeState = getRemainingTime(t.expiresAt);
  const isOpen = t.status === 'open' && !timeState.expired;
  const isAwarded = t.status === 'awarded';

  container.innerHTML = `
    <div class="dashboard-main-grid">
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <div class="card card-elevated animate-fade-in" style="border-top: 4px solid ${isOpen ? 'var(--amber-500)' : (isAwarded ? 'var(--primary-500)' : 'var(--border-medium)')};">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1rem;">
            <div>
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                <h1 style="font-size: 1.85rem;">${escapeHtml(t.cropName)}</h1>
                <span class="badge ${t.tenderType === 'direct' ? 'badge-amber' : 'badge-primary'}">
                  ${t.tenderType === 'direct' ? 'Direct Tender' : 'Open Mandi Tender'}
                </span>
              </div>
              <p style="font-size: 0.875rem; color: var(--text-secondary);">
                Procurement by <strong>${escapeHtml(t.buyerName)}</strong> (${escapeHtml(t.buyerLocation || 'Central Mandi')})
              </p>
            </div>

            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.35rem;">
              <span id="live-countdown-badge" class="tender-timer timer-${timeState.state}" style="font-size: 1rem; padding: 0.5rem 1rem;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                ${isOpen ? timeState.fullText : (isAwarded ? 'Awarded' : 'Tender Ended')}
              </span>
              <span style="font-size: 0.72rem; color: var(--text-tertiary);">Dynamic reverse auction (Max 4 hours)</span>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.75rem; background: var(--bg-surface-elevated); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); margin-bottom: 1.25rem;">
            <div>
              <div style="font-size: 0.72rem; color: var(--text-tertiary); font-weight: 600; text-transform: uppercase;">Required Quantity</div>
              <div style="font-size: 1.25rem; font-weight: 800; font-family: var(--font-heading);">${formatNumber(t.requiredQuantity)} ${t.unit}</div>
            </div>

            <div>
              <div style="font-size: 0.72rem; color: var(--text-tertiary); font-weight: 600; text-transform: uppercase;">Target Ceiling Price</div>
              <div style="font-size: 1.25rem; font-weight: 800; font-family: var(--font-heading);">${formatCurrency(t.targetPricePerUnit)} <span style="font-size: 0.75rem; font-weight: 500; color: var(--text-secondary);">/ ${t.unit}</span></div>
            </div>

            <div>
              <div style="font-size: 0.72rem; color: var(--text-tertiary); font-weight: 600; text-transform: uppercase;">Current Best Bid</div>
              <div style="font-size: 1.25rem; font-weight: 800; font-family: var(--font-heading); color: ${t.currentBestBid ? 'var(--primary-500)' : 'var(--text-tertiary)'};">
                ${t.currentBestBid ? `${formatCurrency(t.currentBestBid)} / ${t.unit}` : 'Waiting for bids'}
              </div>
            </div>

            <div>
              <div style="font-size: 0.72rem; color: var(--text-tertiary); font-weight: 600; text-transform: uppercase;">Total Quotes</div>
              <div style="font-size: 1.25rem; font-weight: 800; font-family: var(--font-heading); color: var(--amber-500);">${t.bidCount || 0}</div>
            </div>
          </div>

          ${t.description ? `
            <div style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.5; padding: 0.75rem; background: var(--bg-input); border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
              <strong>Quality Specs / Notes:</strong> ${escapeHtml(t.description)}
            </div>
          ` : ''}

          ${isAwarded ? `
            <div style="margin-top: 1.25rem; background: var(--bg-badge); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: var(--radius-md); padding: 1rem; display: flex; align-items: center; gap: 0.75rem;">
              <div style="width: 40px; height: 40px; border-radius: var(--radius-full); background: var(--primary-500); color: #fff; display: flex; align-items: center; justify-content: center;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <div>
                <strong style="color: var(--primary-500); font-size: 1rem;">Tender Successfully Awarded!</strong>
                <div style="font-size: 0.85rem; color: var(--text-primary);">
                  Won by <strong>${escapeHtml(t.awardedFarmerName || 'Farmer')}</strong> at <strong>${formatCurrency(t.finalPricePerUnit)} / ${t.unit}</strong>
                </div>
              </div>
            </div>
          ` : ''}

          ${isBuyerOwner && isOpen ? `
            <div style="margin-top: 1rem; display: flex; justify-content: flex-end;">
              <button id="close-tender-early-btn" class="btn btn-ghost btn-sm" style="color: var(--danger-500);">
                Close Tender Now
              </button>
            </div>
          ` : ''}
        </div>

        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h3 style="font-size: 1.2rem;">Live Competitive Bids Feed</h3>
            <span class="badge badge-neutral">${currentBidsList.length} Quotes</span>
          </div>

          <div style="overflow-x: auto;">
            <table class="bids-table">
              <thead>
                <tr>
                  <th>Farmer / Producer</th>
                  <th>Bid Price (₹)</th>
                  <th>Quantity Offered</th>
                  <th>Delivery</th>
                  <th>Submitted</th>
                  ${isBuyerOwner && isOpen ? '<th>Action</th>' : ''}
                </tr>
              </thead>
              <tbody id="live-bids-tbody">
                ${renderBidsRows(isBuyerOwner, isOpen)}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div>
        ${isFarmer && isOpen ? `
          <div class="card card-elevated" style="position: sticky; top: 88px;">
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
              <h3 style="font-size: 1.25rem;">Submit Live Bid</h3>
              <span class="badge badge-primary">Reverse Auction</span>
            </div>
            <p style="font-size: 0.825rem; color: var(--text-secondary); margin-bottom: 1.25rem;">
              Quote your most competitive price. Lower bids rank higher and increase winning chance.
            </p>

            <form id="submit-bid-form">
              <div class="input-group">
                <label class="input-label" for="bid-price">Your Bid Price (₹ per ${t.unit}) *</label>
                <input type="number" id="bid-price" class="input-control" required min="0.1" step="0.01" placeholder="e.g. 23.50" value="${t.currentBestBid ? (t.currentBestBid - 0.5).toFixed(2) : t.targetPricePerUnit}" />
              </div>

              <div class="input-group">
                <label class="input-label" for="bid-quantity">Offered Quantity (${t.unit}) *</label>
                <input type="number" id="bid-quantity" class="input-control" required min="1" step="any" value="${t.requiredQuantity}" />
              </div>

              <div class="input-group">
                <label class="input-label" for="bid-delivery">Delivery Timeline (Days) *</label>
                <input type="number" id="bid-delivery" class="input-control" required min="1" max="30" value="2" />
              </div>

              <div class="input-group">
                <label class="input-label" for="bid-note">Proposal Note / Dispatch Terms</label>
                <textarea id="bid-note" class="textarea-control" rows="2" placeholder="Ready stock in warehouse, lab tested quality..."></textarea>
              </div>

              <button type="submit" id="submit-bid-btn" class="btn btn-primary" style="width: 100%; margin-top: 0.5rem;">
                Submit Competitive Quote
              </button>
            </form>
          </div>
        ` : (isBuyerOwner ? `
          <div class="card" style="position: sticky; top: 88px;">
            <h3 style="font-size: 1.15rem; margin-bottom: 0.5rem;">Merchant Controls</h3>
            <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4; margin-bottom: 1rem;">
              As the tender creator, review live quotes from farmers in real-time. When satisfied with a bid, click <strong>"Accept & Award"</strong> on the bid row.
            </p>
            <div style="background: var(--bg-surface-elevated); padding: 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); font-size: 0.8rem; color: var(--text-secondary);">
              ⏳ <strong>Auto-expiry:</strong> Bidding locks automatically when the countdown reaches 0.
            </div>
          </div>
        ` : `
          <div class="card" style="position: sticky; top: 88px;">
            <h3 style="font-size: 1.15rem; margin-bottom: 0.5rem;">Live Auction Mode</h3>
            <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4;">
              ${!user ? 'Please sign in with Google to place bids on this tender.' : (profile?.role === 'buyer' ? 'You are viewing this tender in merchant mode.' : 'This tender is currently closed for new bids.')}
            </p>
          </div>
        `)}
      </div>
    </div>
  `;

  bindLiveRoomEvents(isBuyerOwner, isOpen, isFarmer);
}

function renderBidsRows(isBuyerOwner, isOpen) {
  if (!currentBidsList || currentBidsList.length === 0) {
    return '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-tertiary);">No bids submitted yet. Be the first farmer to bid!</td></tr>';
  }

  const bestBidPrice = currentTenderData?.currentBestBid;

  return currentBidsList.map((bid, index) => {
    const isWinning = bid.bidPricePerUnit === bestBidPrice;

    return `
      <tr class="${isWinning ? 'winning-bid' : ''}">
        <td>
          <div style="font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 0.35rem;">
            ${escapeHtml(bid.farmerName)}
            ${isWinning ? '<span class="badge badge-primary" style="font-size: 0.65rem;">Lowest Quote</span>' : ''}
          </div>
          <div style="font-size: 0.75rem; color: var(--text-tertiary);">${escapeHtml(bid.farmerLocation)}</div>
        </td>
        <td>
          <strong style="font-size: 1.05rem; color: ${isWinning ? 'var(--primary-500)' : 'var(--text-primary)'}; font-family: var(--font-heading);">
            ${formatCurrency(bid.bidPricePerUnit)}
          </strong>
          <span style="font-size: 0.75rem; color: var(--text-tertiary);">/${bid.unit}</span>
        </td>
        <td>${formatNumber(bid.offeredQuantity)} ${bid.unit}</td>
        <td>${bid.deliveryDays} Days</td>
        <td style="font-size: 0.78rem; color: var(--text-tertiary);">${timeAgo(bid.createdAt)}</td>
        ${isBuyerOwner && isOpen ? `
          <td>
            <button class="btn btn-primary btn-sm award-bid-btn" data-bid-id="${bid.bidId}" data-farmer-id="${bid.farmerId}" data-farmer-name="${escapeHtml(bid.farmerName)}" data-price="${bid.bidPricePerUnit}">
              Accept & Award
            </button>
          </td>
        ` : ''}
      </tr>
    `;
  }).join('');
}

function bindLiveRoomEvents(isBuyerOwner, isOpen, isFarmer) {
  if (isFarmer && isOpen) {
    const form = document.getElementById('submit-bid-form');
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const user = getCurrentUser();
      const profile = getCurrentProfile();
      if (!user) return;

      const submitBtn = document.getElementById('submit-bid-btn');
      const bidPrice = document.getElementById('bid-price').value;
      const offeredQuantity = document.getElementById('bid-quantity').value;
      const deliveryDays = document.getElementById('bid-delivery').value;
      const proposalNote = document.getElementById('bid-note').value;

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting Bid...';

        await placeBid(currentTenderId, {
          farmerId: user.uid,
          farmerName: profile?.displayName || 'Farmer',
          farmerLocation: profile?.location || 'Local Mandi',
          bidPricePerUnit: bidPrice,
          offeredQuantity,
          deliveryDays,
          proposalNote
        });

        showToast('Your quote was placed live on the tender board!', 'success');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Competitive Quote';
      } catch (err) {
        showToast(err.message || 'Error placing bid', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Competitive Quote';
      }
    });
  }

  if (isBuyerOwner && isOpen) {
    document.querySelectorAll('.award-bid-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const bidId = btn.getAttribute('data-bid-id');
        const farmerId = btn.getAttribute('data-farmer-id');
        const farmerName = btn.getAttribute('data-farmer-name');
        const price = btn.getAttribute('data-price');

        if (confirm(`Award this tender to ${farmerName} at ₹${price}/${currentTenderData.unit}?`)) {
          try {
            await awardTender(currentTenderId, {
              bidId,
              farmerId,
              farmerName,
              bidPricePerUnit: parseFloat(price),
              unit: currentTenderData.unit
            });

            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 }
            });

            showToast(`Tender awarded to ${farmerName}!`, 'success');
          } catch (err) {
            showToast(err.message || 'Error awarding tender', 'error');
          }
        }
      });
    });

    document.getElementById('close-tender-early-btn')?.addEventListener('click', async () => {
      if (confirm('Are you sure you want to close this tender early?')) {
        try {
          await closeTender(currentTenderId);
          showToast('Tender closed', 'info');
        } catch (err) {
          showToast(err.message || 'Error closing tender', 'error');
        }
      }
    });
  }
}

export function bindTenderRoomEvents(routerNavigate) {
  if (tenderUnsub) tenderUnsub();
  if (bidsUnsub) bidsUnsub();

  tenderUnsub = subscribeSingleTender(currentTenderId, (tender) => {
    if (!tender) {
      const container = document.getElementById('tender-room-content');
      if (container) {
        container.innerHTML = `
          <div style="text-align: center; padding: 4rem;">
            <h2>Tender Not Found</h2>
            <p style="color: var(--text-secondary); margin: 1rem 0;">This tender may have been removed or does not exist.</p>
            <a href="#/marketplace" class="btn btn-primary">Browse Marketplace</a>
          </div>
        `;
      }
      return;
    }
    currentTenderData = tender;
    renderLiveRoom();
  });

  bidsUnsub = subscribeTenderBids(currentTenderId, (bids) => {
    currentBidsList = bids;
    const tbody = document.getElementById('live-bids-tbody');
    if (tbody && currentTenderData) {
      const user = getCurrentUser();
      const isBuyerOwner = user && currentTenderData.buyerId === user.uid;
      const timeState = getRemainingTime(currentTenderData.expiresAt);
      const isOpen = currentTenderData.status === 'open' && !timeState.expired;
      tbody.innerHTML = renderBidsRows(isBuyerOwner, isOpen);
      bindLiveRoomEvents(isBuyerOwner, isOpen, getCurrentProfile()?.role === 'farmer');
    }
  });

  if (liveTimerInterval) clearInterval(liveTimerInterval);
  liveTimerInterval = setInterval(() => {
    if (!currentTenderData) return;
    const timeState = getRemainingTime(currentTenderData.expiresAt);
    const badge = document.getElementById('live-countdown-badge');
    if (badge) {
      badge.className = `tender-timer timer-${timeState.state}`;
      badge.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
        ${currentTenderData.status === 'open' ? (timeState.expired ? 'Ended' : timeState.fullText) : (currentTenderData.status === 'awarded' ? 'Awarded' : 'Tender Ended')}
      `;
    }
  }, 1000);
}
