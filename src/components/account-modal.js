import { getCurrentUser, getCurrentProfile, deleteUserAccount, logout } from '../services/auth-service.js';
import { openModal } from './modal.js';
import { showToast } from './toast.js';
import { escapeHtml } from '../utils.js';

export function openAccountModal(routerNavigate) {
  const user = getCurrentUser();
  const profile = getCurrentProfile();

  if (!user) {
    showToast('Please sign in first', 'error');
    return;
  }

  const roleText = profile?.role === 'farmer' ? '🌾 Farmer / Producer' : (profile?.role === 'buyer' ? '💼 Merchant / Buyer' : 'Not Selected');

  const bodyHtml = `
    <div style="display: flex; flex-direction: column; gap: 1.25rem;">
      <div style="display: flex; align-items: center; gap: 1rem; padding-bottom: 1.25rem; border-bottom: 1px solid var(--border-subtle);">
        ${user.photoURL ? `
          <img src="${user.photoURL}" alt="${escapeHtml(profile?.displayName || user.displayName || 'User')}" style="width: 56px; height: 56px; border-radius: var(--radius-full); object-fit: cover; border: 2px solid var(--primary-500);" />
        ` : `
          <div class="user-avatar-placeholder" style="width: 56px; height: 56px; font-size: 1.5rem;">${escapeHtml((profile?.displayName || user.displayName || 'U').charAt(0).toUpperCase())}</div>
        `}
        <div>
          <h4 style="font-size: 1.15rem; margin-bottom: 0.2rem; color: var(--text-primary);">${escapeHtml(profile?.displayName || user.displayName || 'User')}</h4>
          <p style="font-size: 0.85rem; color: var(--text-secondary);">${escapeHtml(user.email || 'No email provided')}</p>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 0.65rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0.75rem; background: var(--bg-surface-elevated); border-radius: var(--radius-sm);">
          <span style="font-size: 0.85rem; color: var(--text-secondary); font-weight: 500;">Current Role</span>
          <span style="font-size: 0.85rem; font-weight: 700; color: var(--primary-600);">${roleText}</span>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0.75rem; background: var(--bg-surface-elevated); border-radius: var(--radius-sm);">
          <span style="font-size: 0.85rem; color: var(--text-secondary); font-weight: 500;">Location / Region</span>
          <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-primary);">${escapeHtml(profile?.location || 'Not set')}</span>
        </div>

        ${import.meta.env.VITE_SUPPORT_EMAIL ? `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0.75rem; background: var(--bg-surface-elevated); border-radius: var(--radius-sm);">
            <span style="font-size: 0.85rem; color: var(--text-secondary); font-weight: 500;">Support Contact</span>
            <a href="mailto:${import.meta.env.VITE_SUPPORT_EMAIL}" style="font-size: 0.85rem; font-weight: 600; color: var(--primary-600); text-decoration: none;">${escapeHtml(import.meta.env.VITE_SUPPORT_EMAIL)}</a>
          </div>
        ` : ''}
      </div>

      <div style="margin-top: 0.5rem; padding: 1rem; border: 1px solid rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.06); border-radius: var(--radius-md);">
        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.4rem;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--danger-500)" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          <span style="font-size: 0.9rem; font-weight: 700; color: var(--danger-500);">Danger Zone</span>
        </div>
        <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.85rem; line-height: 1.4;">
          Permanently delete your profile, crop listings, active bids, tenders, and notifications. This action cannot be undone.
        </p>
        <button id="open-delete-account-btn" class="btn btn-danger btn-sm" style="width: 100%; font-size: 0.85rem; padding: 0.65rem;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          Delete Account & All Data
        </button>
      </div>
    </div>
  `;

  const footerHtml = `
    <button id="account-modal-sign-out-btn" class="btn btn-ghost btn-sm" style="margin-right: auto;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
      Sign Out
    </button>
    <button id="account-modal-edit-role-btn" class="btn btn-outline btn-sm">Edit Info</button>
    <button id="account-modal-close-btn" class="btn btn-secondary btn-sm">Close</button>
  `;

  const modal = openModal({
    title: 'Account Settings',
    bodyHtml,
    footerHtml,
    onOpen: (backdrop, close) => {
      backdrop.querySelector('#account-modal-close-btn')?.addEventListener('click', close);

      backdrop.querySelector('#account-modal-sign-out-btn')?.addEventListener('click', async () => {
        close();
        await logout();
        showToast('Signed out successfully', 'info');
        routerNavigate('');
      });
      
      backdrop.querySelector('#account-modal-edit-role-btn')?.addEventListener('click', () => {
        close();
        routerNavigate('role-select');
      });



      backdrop.querySelector('#open-delete-account-btn')?.addEventListener('click', () => {
        close();
        openDeleteConfirmationModal(routerNavigate);
      });
    }
  });
}

export function openDeleteConfirmationModal(routerNavigate) {
  const user = getCurrentUser();
  if (!user) {
    showToast('No authenticated user found', 'error');
    return;
  }

  const bodyHtml = `
    <div style="display: flex; flex-direction: column; gap: 1.15rem;">
      <div style="padding: 0.85rem 1rem; border-radius: var(--radius-md); background: rgba(239, 68, 68, 0.1); border: 1px solid var(--danger-500); color: var(--danger-500); display: flex; align-items: flex-start; gap: 0.65rem;">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink: 0; margin-top: 2px;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        <div style="font-size: 0.85rem; line-height: 1.4; color: var(--text-primary);">
          <strong style="color: var(--danger-500);">Warning: This action is permanent and irreversible!</strong>
        </div>
      </div>

      <p style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.5;">
        Deleting your account will permanently wipe:
      </p>

      <ul style="font-size: 0.825rem; color: var(--text-secondary); margin-left: 1.25rem; display: flex; flex-direction: column; gap: 0.35rem;">
        <li>Your account profile & authentication records</li>
        <li>All active crop market listings and price history</li>
        <li>All tenders, proposals, and bidding submissions</li>
        <li>All unread and read notifications</li>
      </ul>

      <div class="input-group" style="margin-top: 0.5rem;">
        <label class="input-label" for="confirm-delete-input" style="font-size: 0.85rem; font-weight: 600;">
          Type <span style="color: var(--danger-500); font-weight: 800;">DELETE</span> to confirm:
        </label>
        <input type="text" id="confirm-delete-input" class="input-control" placeholder="DELETE" autocomplete="off" />
      </div>
    </div>
  `;

  const footerHtml = `
    <button id="cancel-delete-btn" class="btn btn-secondary btn-sm">Cancel</button>
    <button id="confirm-delete-action-btn" class="btn btn-danger btn-sm" disabled style="opacity: 0.6; cursor: not-allowed;">
      Permanently Delete Account
    </button>
  `;

  openModal({
    title: 'Delete Account Permanently',
    bodyHtml,
    footerHtml,
    onOpen: (backdrop, close) => {
      const input = backdrop.querySelector('#confirm-delete-input');
      const actionBtn = backdrop.querySelector('#confirm-delete-action-btn');
      const cancelBtn = backdrop.querySelector('#cancel-delete-btn');

      cancelBtn?.addEventListener('click', close);

      input?.addEventListener('input', () => {
        const value = input.value.trim();
        if (value === 'DELETE') {
          actionBtn.disabled = false;
          actionBtn.style.opacity = '1';
          actionBtn.style.cursor = 'pointer';
        } else {
          actionBtn.disabled = true;
          actionBtn.style.opacity = '0.6';
          actionBtn.style.cursor = 'not-allowed';
        }
      });

      actionBtn?.addEventListener('click', async () => {
        try {
          actionBtn.disabled = true;
          actionBtn.textContent = 'Deleting all account data...';
          await deleteUserAccount();
          close();
          showToast('Your account and data have been permanently deleted', 'success');
          routerNavigate('');
        } catch (err) {
          actionBtn.disabled = false;
          actionBtn.textContent = 'Permanently Delete Account';
          showToast(err.message || 'Failed to delete account. Please try again.', 'error');
        }
      });
    }
  });
}
