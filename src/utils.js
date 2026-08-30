export function formatCurrency(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(amount);
}

export function formatNumber(val) {
  if (typeof val !== 'number' || isNaN(val)) return '0';
  return new Intl.NumberFormat('en-IN').format(val);
}

export function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function timeAgo(timestamp) {
  if (!timestamp) return '';
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function getRemainingTime(expiresAt) {
  if (!expiresAt) return { expired: true, text: 'Expired', state: 'expired' };
  const diff = expiresAt - Date.now();
  if (diff <= 0) return { expired: true, text: 'Ended', state: 'expired' };
  
  const totalMinutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  let state = 'green';
  if (totalMinutes < 15) {
    state = 'red';
  } else if (totalMinutes < 60) {
    state = 'amber';
  }

  if (hours > 0) {
    return {
      expired: false,
      text: `${hours}h ${minutes}m left`,
      fullText: `${hours}h ${minutes}m ${seconds}s`,
      state
    };
  }
  return {
    expired: false,
    text: `${minutes}m ${seconds}s left`,
    fullText: `${minutes}m ${seconds}s`,
    state
  };
}

const imageCache = new Map();

export function getCropImage(cropName) {
  const name = (cropName || 'Farm produce').trim();
  const cached = imageCache.get(name.toLowerCase());
  if (cached) return cached;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" width="400" height="250"><rect width="100%" height="100%" fill="#f1f5f9"/><g fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" transform="translate(180, 85) scale(1.6)"><path d="M7 20h10M12 20v-8M12 12C9 12 5 9 5 5c4 0 7 4 7 7M12 12c3 0 7-3 7-7-4 0-7 4-7 7"/></g><text x="50%" y="180" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="600" fill="#64748b" text-anchor="middle">${name}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export async function fetchWikipediaCropImage(cropName) {
  if (!cropName) return null;
  const key = cropName.trim().toLowerCase();
  if (imageCache.has(key)) return imageCache.get(key);

  try {
    const formattedTitle = encodeURIComponent(cropName.trim().split(' ')[0]);
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${formattedTitle}`);
    if (res.ok) {
      const data = await res.json();
      if (data.thumbnail?.source) {
        imageCache.set(key, data.thumbnail.source);
        return data.thumbnail.source;
      }
    }
  } catch {
    // Fail silently and fallback to default placeholder
  }
  return null;
}
