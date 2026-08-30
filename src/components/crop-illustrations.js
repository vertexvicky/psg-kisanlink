export const CropIcons = {
  wheat: `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="crop-svg">
      <path d="M12 22V2M12 2L9 5M12 2L15 5M12 6L8 9M12 6L16 9M12 10L7 13M12 10L17 13M12 14L8 17M12 14L16 17"/>
    </svg>
  `,
  sprout: `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="crop-svg">
      <path d="M7 20h10M12 20v-8M12 12C9 12 5 9 5 5c4 0 7 4 7 7M12 12c3 0 7-3 7-7-4 0-7 4-7 7"/>
    </svg>
  `,
  onion: `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="crop-svg">
      <path d="M12 3v3M10 3l2 3 2-3"/>
      <path d="M12 6c-5 0-8 4-8 9a8 8 0 0 0 16 0c0-5-3-9-8-9z"/>
      <path d="M12 6v15"/>
    </svg>
  `,
  tomato: `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="crop-svg">
      <circle cx="12" cy="13" r="8"/>
      <path d="M12 3v2M9 4l3 1 3-1"/>
    </svg>
  `,
  carrot: `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="crop-svg">
      <path d="M17 3l4 4M19 1l-2 6M23 5l-6-2"/>
      <path d="M17 7L5 19a2 2 0 0 0 0 3 2 2 0 0 0 3 0L20 10c1-1 0-3-3-3z"/>
    </svg>
  `,
  corn: `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="crop-svg">
      <path d="M12 2v3M9 3l3 2 3-2"/>
      <ellipse cx="12" cy="13" rx="4" ry="7"/>
      <path d="M8 17c0-4 2-8 2-8M16 17c0-4-2-8-2-8"/>
    </svg>
  `,
  rice: `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="crop-svg">
      <path d="M6 21c4-6 7-12 7-18"/>
      <ellipse cx="13" cy="5" rx="2" ry="3"/>
      <ellipse cx="11" cy="9" rx="2" ry="3"/>
      <ellipse cx="9" cy="13" rx="2" ry="3"/>
      <ellipse cx="7" cy="17" rx="2" ry="3"/>
    </svg>
  `,
  tractor: `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="crop-svg">
      <path d="M3 17h4M14 17h3M8 17a3 3 0 1 0-6 0 3 3 0 0 0 6 0zM21 17a4 4 0 1 0-8 0 4 4 0 0 0 8 0z"/>
      <path d="M5 14V6h8l3 4h4v4h-3M10 6v4"/>
    </svg>
  `,
  basket: `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="crop-svg">
      <path d="M4 10h16l-2 10H6L4 10z"/>
      <path d="M8 10V6a4 4 0 0 1 8 0v4M4 14h16M7 18h10"/>
    </svg>
  `,
  sun: `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="crop-svg">
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
    </svg>
  `,
  farmer: `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="crop-svg">
      <path d="M3 11c0-1.5 4.5-3 9-3s9 1.5 9 3-4.5 2-9 2-9-.5-9-2z"/>
      <path d="M7 8.5C7.5 5.5 9 3 12 3s4.5 2.5 5 5.5"/>
      <path d="M8 13v2a4 4 0 0 0 8 0v-2"/>
      <circle cx="10" cy="14" r="0.5" fill="currentColor"/>
      <circle cx="14" cy="14" r="0.5" fill="currentColor"/>
      <path d="M5 22c0-2.5 3-3.5 7-3.5s7 1 7 3.5"/>
    </svg>
  `,
  logo: `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
    </svg>
  `
};

export function getCropIllustration(name = '') {
  const n = name.toLowerCase();
  if (n.includes('corn') || n.includes('maize')) return CropIcons.corn;
  if (n.includes('wheat')) return CropIcons.wheat;
  if (n.includes('onion')) return CropIcons.onion;
  if (n.includes('tomato')) return CropIcons.tomato;
  if (n.includes('carrot')) return CropIcons.carrot;
  if (n.includes('rice') || n.includes('paddy')) return CropIcons.rice;
  return CropIcons.sprout;
}
