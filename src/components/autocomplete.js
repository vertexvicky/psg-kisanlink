import { escapeHtml } from '../utils.js';

export function setupCropAutocomplete(inputEl, suggestions = []) {
  if (!inputEl) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'autocomplete-wrapper';
  inputEl.parentNode.insertBefore(wrapper, inputEl);
  wrapper.appendChild(inputEl);

  const dropdown = document.createElement('div');
  dropdown.className = 'autocomplete-dropdown';
  dropdown.style.display = 'none';
  wrapper.appendChild(dropdown);

  let isOpen = false;

  function closeDropdown() {
    dropdown.innerHTML = '';
    dropdown.style.display = 'none';
    isOpen = false;
  }

  function renderList(query = '') {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? suggestions.filter(item => item.toLowerCase().includes(q))
      : suggestions;

    if (filtered.length === 0) {
      closeDropdown();
      return;
    }

    dropdown.innerHTML = filtered.slice(0, 8).map(item => `
      <div class="autocomplete-item" data-value="${escapeHtml(item)}" tabindex="0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M7 20h10M12 20v-8M12 12C9 12 5 9 5 5c4 0 7 4 7 7M12 12c3 0 7-3 7-7-4 0-7 4-7 7"/>
        </svg>
        <span>${escapeHtml(item)}</span>
      </div>
    `).join('');

    dropdown.style.display = 'block';
    isOpen = true;

    dropdown.querySelectorAll('.autocomplete-item').forEach(el => {
      const selectItem = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        const val = el.getAttribute('data-value');
        if (val) {
          inputEl.value = val;
          inputEl.dispatchEvent(new Event('input', { bubbles: true }));
          inputEl.dispatchEvent(new Event('change', { bubbles: true }));
        }
        closeDropdown();
      };

      el.addEventListener('mousedown', selectItem);
      el.addEventListener('click', selectItem);
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') selectItem(e);
      });
    });
  }

  inputEl.addEventListener('focus', () => {
    renderList(inputEl.value);
  });

  inputEl.addEventListener('input', () => {
    renderList(inputEl.value);
  });

  document.addEventListener('click', (e) => {
    if (isOpen && !wrapper.contains(e.target)) {
      closeDropdown();
    }
  });

  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDropdown();
    }
  });
}
