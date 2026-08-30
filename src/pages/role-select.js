import { getCurrentUser, getCurrentProfile, completeRegistration, isRegistrationComplete } from '../services/auth-service.js';
import { showToast } from '../components/toast.js';
import { CropIcons } from '../components/crop-illustrations.js';

let selectedRole = 'farmer';

export function renderRoleSelectPage() {
  const user = getCurrentUser();
  const profile = getCurrentProfile();

  const userName = profile?.displayName || user?.displayName || '';
  const userLocation = profile?.location || '';

  if (profile?.role === 'farmer' || profile?.role === 'buyer') {
    selectedRole = profile.role;
  }

  return `
    <div class="container" style="padding-top: 2rem; padding-bottom: 4rem;">
      <div class="role-selector-card animate-slide-up">
        <div style="text-align: center; margin-bottom: 1.5rem;">
          <div style="display: flex; justify-content: center; gap: 0.5rem; margin-bottom: 0.75rem;">
            <span class="animate-sway">${CropIcons.sprout}</span>
            <span class="animate-sun">${CropIcons.sun}</span>
            <span class="animate-float">${CropIcons.wheat}</span>
          </div>
          <h2 style="font-size: 1.85rem; margin-bottom: 0.5rem;">Complete Your Profile</h2>
          <p style="color: var(--text-secondary); font-size: 0.95rem;">
            Fill in your details to get started on KisanLink
          </p>
        </div>

        <div class="registration-steps">
          <div class="step-indicator">
            <div class="step-dot active" id="step-dot-1">1</div>
            <div class="step-line"></div>
            <div class="step-dot" id="step-dot-2">2</div>
            <div class="step-line"></div>
            <div class="step-dot" id="step-dot-3">3</div>
          </div>
          <div class="step-labels">
            <span class="step-label active" id="step-label-1">Your Info</span>
            <span class="step-label" id="step-label-2">Select Role</span>
            <span class="step-label" id="step-label-3">Confirm</span>
          </div>
        </div>

        <div id="reg-step-1" class="reg-step-panel">
          <div class="input-group">
            <label class="input-label" for="reg-name-input">Full Name</label>
            <input type="text" id="reg-name-input" class="input-control" placeholder="Your full name" value="${userName}" />
          </div>

          <div class="input-group">
            <label class="input-label" for="reg-location-input">Location / Mandi Region</label>
            <input type="text" id="reg-location-input" class="input-control" placeholder="e.g. Nashik, Maharashtra" value="${userLocation}" />
          </div>

          <div style="margin-top: 1.5rem;">
            <button id="reg-next-1" class="btn btn-primary" style="width: 100%; padding: 0.85rem;">
              Next — Choose Your Role
            </button>
          </div>
        </div>

        <div id="reg-step-2" class="reg-step-panel" style="display: none;">
          <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1rem; text-align: center;">
            How will you use KisanLink?
          </p>

          <div class="role-options">
            <div id="option-farmer" class="role-option-box ${selectedRole === 'farmer' ? 'selected' : ''}">
              <div style="width: 56px; height: 56px; border-radius: var(--radius-full); background: var(--bg-badge); color: var(--primary-600); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.15);">
                <span class="animate-sway">${CropIcons.farmer}</span>
              </div>
              <div>
                <h3 style="font-size: 1.15rem; margin-bottom: 0.25rem; color: var(--primary-700);">Farmer / Producer</h3>
                <p style="color: var(--text-secondary); font-size: 0.82rem;">
                  List crops with custom pricing, participate in tenders, and discuss mandi prices with peers.
                </p>
              </div>
            </div>

            <div id="option-buyer" class="role-option-box ${selectedRole === 'buyer' ? 'selected' : ''}">
              <div style="width: 56px; height: 56px; border-radius: var(--radius-full); background: rgba(245, 158, 11, 0.15); color: var(--amber-500); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15);">
                <span class="animate-float">${CropIcons.tractor}</span>
              </div>
              <div>
                <h3 style="font-size: 1.15rem; margin-bottom: 0.25rem; color: var(--amber-700);">Merchant / Bulk Buyer</h3>
                <p style="color: var(--text-secondary); font-size: 0.82rem;">
                  Browse available crops, create timed tenders (up to 4 hours), and bid directly to farmers.
                </p>
              </div>
            </div>
          </div>

          <div style="display: flex; gap: 0.75rem; margin-top: 1.5rem;">
            <button id="reg-back-2" class="btn btn-outline" style="flex: 1; padding: 0.85rem;">
              Back
            </button>
            <button id="reg-next-2" class="btn btn-primary" style="flex: 2; padding: 0.85rem;">
              Review & Confirm
            </button>
          </div>
        </div>

        <div id="reg-step-3" class="reg-step-panel" style="display: none;">
          <div class="review-card">
            <h4 style="margin-bottom: 1rem; color: var(--text-primary); font-size: 1.05rem;">Review Your Details</h4>
            <div class="review-row">
              <span class="review-label">Name</span>
              <span class="review-value" id="review-name"></span>
            </div>
            <div class="review-row">
              <span class="review-label">Location</span>
              <span class="review-value" id="review-location"></span>
            </div>
            <div class="review-row">
              <span class="review-label">Role</span>
              <span class="review-value" id="review-role"></span>
            </div>
          </div>

          <div style="display: flex; gap: 0.75rem; margin-top: 1.5rem;">
            <button id="reg-back-3" class="btn btn-outline" style="flex: 1; padding: 0.85rem;">
              Back
            </button>
            <button id="reg-submit" class="btn btn-primary" style="flex: 2; padding: 0.85rem;">
              🌾 Complete Registration
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function showStep(stepNum) {
  for (let i = 1; i <= 3; i++) {
    const panel = document.getElementById(`reg-step-${i}`);
    const dot = document.getElementById(`step-dot-${i}`);
    const label = document.getElementById(`step-label-${i}`);
    if (panel) panel.style.display = i === stepNum ? 'block' : 'none';
    if (dot) {
      dot.classList.toggle('active', i <= stepNum);
      dot.classList.toggle('completed', i < stepNum);
    }
    if (label) label.classList.toggle('active', i <= stepNum);
  }
}

export function bindRoleSelectEvents(routerNavigate) {
  const farmerOpt = document.getElementById('option-farmer');
  const buyerOpt = document.getElementById('option-buyer');

  farmerOpt?.addEventListener('click', () => {
    selectedRole = 'farmer';
    farmerOpt.classList.add('selected');
    buyerOpt?.classList.remove('selected');
  });

  buyerOpt?.addEventListener('click', () => {
    selectedRole = 'buyer';
    buyerOpt.classList.add('selected');
    farmerOpt?.classList.remove('selected');
  });

  document.getElementById('reg-next-1')?.addEventListener('click', () => {
    const name = document.getElementById('reg-name-input')?.value.trim();
    const location = document.getElementById('reg-location-input')?.value.trim();

    if (!name) {
      showToast('Please enter your full name', 'error');
      document.getElementById('reg-name-input')?.focus();
      return;
    }
    if (!location) {
      showToast('Please enter your location or mandi region', 'error');
      document.getElementById('reg-location-input')?.focus();
      return;
    }

    showStep(2);
  });

  document.getElementById('reg-back-2')?.addEventListener('click', () => {
    showStep(1);
  });

  document.getElementById('reg-next-2')?.addEventListener('click', () => {
    const name = document.getElementById('reg-name-input')?.value.trim();
    const location = document.getElementById('reg-location-input')?.value.trim();

    document.getElementById('review-name').textContent = name;
    document.getElementById('review-location').textContent = location;
    document.getElementById('review-role').textContent = selectedRole === 'farmer' ? '🌾 Farmer / Producer' : '💼 Merchant / Bulk Buyer';

    showStep(3);
  });

  document.getElementById('reg-back-3')?.addEventListener('click', () => {
    showStep(2);
  });

  document.getElementById('reg-submit')?.addEventListener('click', async () => {
    const user = getCurrentUser();
    if (!user) {
      showToast('Please sign in first', 'error');
      return;
    }

    const name = document.getElementById('reg-name-input')?.value.trim();
    const location = document.getElementById('reg-location-input')?.value.trim();

    const submitBtn = document.getElementById('reg-submit');

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';
      await completeRegistration(selectedRole, name, location);
      showToast(`Welcome to KisanLink as ${selectedRole === 'farmer' ? 'Farmer' : 'Merchant'}! 🎉`, 'success');
      routerNavigate(selectedRole === 'farmer' ? 'farmer-dashboard' : 'buyer-dashboard');
    } catch (e) {
      showToast(e.message || 'Error saving profile', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = '🌾 Complete Registration';
    }
  });
}
