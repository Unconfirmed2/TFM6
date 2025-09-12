// Lightweight card zoom handler

function createExpandButton() {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'card-expand-btn';
  btn.setAttribute('aria-label', 'Expand card');

  // Inline SVG magnifier icon
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '18');
  svg.setAttribute('height', '18');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'white');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');

  const circle = document.createElementNS(svgNS, 'circle');
  circle.setAttribute('cx', '11');
  circle.setAttribute('cy', '11');
  circle.setAttribute('r', '7');
  svg.appendChild(circle);

  const line = document.createElementNS(svgNS, 'line');
  line.setAttribute('x1', '21');
  line.setAttribute('y1', '21');
  line.setAttribute('x2', '16.65');
  line.setAttribute('y2', '16.65');
  svg.appendChild(line);

  btn.appendChild(svg);
  return btn;
}

function wrapForZoom(cardEl: HTMLElement) {
  const wrapper = document.createElement('div');
  wrapper.className = 'card-zoom-wrapper';
  // clone the card to show in overlay
  const clone = cardEl.cloneNode(true) as HTMLElement;
  // remove any existing expand buttons on the clone (and disable any click handlers)
  const oldBtns = clone.querySelectorAll('.card-expand-btn');
  oldBtns.forEach((b) => {
    // remove from DOM to avoid duplicate behavior
    if (b.parentElement) b.parentElement.removeChild(b);
  });
  wrapper.appendChild(clone);
  return wrapper;
}

function openZoom(cardEl: HTMLElement) {
  const overlay = document.createElement('div');
  overlay.className = 'card-zoom-overlay';
  overlay.tabIndex = -1;

  const wrapper = wrapForZoom(cardEl);
  wrapper.classList.add('card-zoomed');
  overlay.appendChild(wrapper);

  function close() {
    if (overlay.parentElement) overlay.parentElement.removeChild(overlay);
    document.removeEventListener('keydown', onKey);
  }

  function onOverlayClick(e: MouseEvent) {
    if (e.target === overlay) close();
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') close();
  }

  overlay.addEventListener('click', onOverlayClick);
  document.addEventListener('keydown', onKey);

  document.body.appendChild(overlay);
}

function addButtonsToCards() {
  const cards = Array.from(document.querySelectorAll<HTMLElement>('.card-container'));
  cards.forEach((card) => {
    // don't add twice
    if (card.querySelector('.card-expand-btn')) return;
    const btn = createExpandButton();
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openZoom(card);
    });
    card.appendChild(btn);
  });
}

// Mutation observer to handle dynamic card lists
function observeMutations() {
  const observer = new MutationObserver(() => {
    addButtonsToCards();
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

export function initCardZoom() {
  if (typeof window === 'undefined') return;
  document.addEventListener('DOMContentLoaded', () => {
    addButtonsToCards();
    observeMutations();
  });
}

// Auto-init if script is loaded after DOMReady
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(() => initCardZoom(), 0);
}
