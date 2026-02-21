/**
 * app.js - Main renderer for Wildpedia
 * Detects current page and renders appropriate content
 */
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

window.addEventListener('beforeunload', () => {
  sessionStorage.setItem('ak-scroll-' + location.pathname, window.scrollY);
});

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await Data.init();
    await I18n.init();
  } catch (e) {
    console.error('Wildpedia init failed:', e);
    return;
  }

  if (typeof AnimalSelector !== 'undefined') AnimalSelector.init();

  _setupTooltip();
  _setupScrollTop();

  const page = detectPage();
  renderPage(page);

  const savedY = sessionStorage.getItem('ak-scroll-' + location.pathname);
  if (savedY) {
    requestAnimationFrame(() => window.scrollTo(0, parseInt(savedY, 10)));
  }

  document.addEventListener('ak-lang-change', () => renderPage(detectPage()));

  // Horizontal scroll arrows for .grid-5 containers
  document.querySelectorAll('.grid-5').forEach(grid => {
    const wrapper = document.createElement('div');
    wrapper.className = 'scroll-wrapper';
    grid.parentNode.insertBefore(wrapper, grid);
    wrapper.appendChild(grid);

    const leftBtn = document.createElement('button');
    leftBtn.className = 'scroll-arrow scroll-arrow-left';
    leftBtn.innerHTML = '&#9664;';
    leftBtn.setAttribute('aria-label', 'Scroll left');

    const rightBtn = document.createElement('button');
    rightBtn.className = 'scroll-arrow scroll-arrow-right';
    rightBtn.innerHTML = '&#9654;';
    rightBtn.setAttribute('aria-label', 'Scroll right');

    wrapper.appendChild(leftBtn);
    wrapper.appendChild(rightBtn);

    function updateArrows() {
      const canLeft = grid.scrollLeft > 5;
      const canRight = grid.scrollLeft < grid.scrollWidth - grid.clientWidth - 5;
      leftBtn.classList.toggle('visible', canLeft);
      rightBtn.classList.toggle('visible', canRight);
    }

    grid.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    setTimeout(updateArrows, 200);

    leftBtn.addEventListener('click', () => grid.scrollBy({ left: -220, behavior: 'smooth' }));
    rightBtn.addEventListener('click', () => grid.scrollBy({ left: 220, behavior: 'smooth' }));
  });
});

/* ===== Page detection ===== */
function detectPage() {
  const path = window.location.pathname.toLowerCase();
  if (path.includes('predators-prey')) return 'predators-prey';
  if (path.includes('super-senses')) return 'super-senses';
  if (path.includes('human-bonds')) return 'human-bonds';
  if (path.includes('ecosystem-roles')) return 'ecosystem-roles';
  if (path.includes('records-extremes')) return 'records-extremes';
  if (path.includes('conservation')) return 'conservation';
  if (path.includes('animal-detail')) return 'animal-detail';
  if (path.includes('compare')) return 'compare';
  if (path.includes('world-map')) return 'world-map';
  if (path.includes('quiz')) return 'quiz';
  return 'index';
}

/* ===== Render dispatch ===== */
function renderPage(page) {
  const renderers = {
    'index': renderIndex,
    'predators-prey': renderPredatorsPrey,
    'super-senses': renderSuperSenses,
    'human-bonds': renderHumanBonds,
    'ecosystem-roles': renderEcosystemRoles,
    'records-extremes': renderRecordsExtremes,
    'conservation': renderConservation,
    'animal-detail': renderAnimalDetail,
    'compare': renderCompare,
    'world-map': renderWorldMap,
    'quiz': renderQuiz
  };
  if (renderers[page]) renderers[page]();
}


/* ==========================================================================
   HELPER FUNCTIONS
   ========================================================================== */

function _animalIcon(animal) {
  return animal.emoji || '🐾';
}

function _t(key) { return I18n.t(key); }

function _animalName(animal) { return I18n.getAnimalName(animal); }

function _iucnBadge(status) {
  const color = Data.getIUCNColor(status);
  return `<span class="iucn-badge" style="background:${color}">${status}</span>`;
}

function _dangerDots(level) {
  let html = '<span class="danger-meter">';
  for (let i = 1; i <= 5; i++) {
    const active = i <= level;
    const color = active ? Data.getDangerColor(i) : '#ddd';
    html += `<span class="danger-dot" style="background:${color}"></span>`;
  }
  html += '</span>';
  return html;
}

function _classBadge(cls) {
  const colors = {
    mammal: '#BF6A1F', bird: '#1565C0', reptile: '#2E7D32',
    amphibian: '#6A1B9A', fish: '#0097A7', invertebrate: '#795548'
  };
  return `<span class="animal-class-badge" style="background:${colors[cls] || '#999'}">${_t('class.' + cls)}</span>`;
}

function _statBar(label, value, max, unit, color) {
  const pct = Math.min((value / max) * 100, 100);
  return `<div class="stat-bar-row">
    <span class="stat-bar-label">${label}</span>
    <div class="stat-bar-track"><div class="stat-bar-fill" style="width:${pct}%;background:${color || 'var(--ak-primary)'}"></div></div>
    <span class="stat-bar-value">${value} ${unit}</span>
  </div>`;
}

function _animalCard(animal, opts) {
  opts = opts || {};
  const name = _animalName(animal);
  const emoji = _animalIcon(animal);
  const extra = opts.subtitle || '';
  return `<a href="animal-detail.html?id=${animal.id}" class="card overview-card" style="border-left-color:${opts.color || 'var(--ak-primary)'}">
    <span class="card-icon">${emoji}</span>
    <span class="card-title">${name}</span>
    ${extra ? `<div class="card-description">${extra}</div>` : ''}
    ${opts.badge || ''}
    <span class="card-link">${_t('detail.view') || 'View profile →'}</span>
  </a>`;
}

function _shareBar(containerId, url, text) {
  const el = document.getElementById(containerId);
  if (!el) return;
  url = url || window.location.href;
  text = text || 'Wildpedia - Discover the Animal Kingdom';
  el.innerHTML = `<div class="share-bar">
    <span class="share-bar-label">${_t('share.label')}</span>
    <div class="share-bar-buttons">
      <button class="share-btn share-whatsapp" onclick="window.open('https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}','_blank')" title="WhatsApp">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.025.507 3.934 1.395 5.608L0 24l6.579-1.35A11.932 11.932 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75c-1.875 0-3.63-.51-5.13-1.395l-.36-.225-3.735.99.99-3.63-.24-.375A9.677 9.677 0 012.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75z"/></svg>
      </button>
      <button class="share-btn share-x" onclick="window.open('https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}','_blank')" title="X">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
      </button>
      <button class="share-btn share-facebook" onclick="window.open('https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}','_blank')" title="Facebook">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
      </button>
      <button class="share-btn share-telegram" onclick="window.open('https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}','_blank')" title="Telegram">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
      </button>
      <button class="share-btn share-copy" onclick="_copyLink(this,'${url}')" title="${_t('share.copy')}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
      </button>
    </div>
  </div>`;
}

function _copyLink(btn, url) {
  navigator.clipboard.writeText(url).then(() => {
    btn.classList.add('copied');
    setTimeout(() => btn.classList.remove('copied'), 2000);
  });
}

function _setupTooltip() {
  let tip = document.getElementById('ak-tooltip');
  if (!tip) {
    tip = document.createElement('div');
    tip.id = 'ak-tooltip';
    document.body.appendChild(tip);
  }
}

function _setupScrollTop() {
  const btn = document.createElement('button');
  btn.className = 'scroll-top-btn';
  btn.innerHTML = '&#9650;';
  btn.setAttribute('aria-label', 'Scroll to top');
  document.body.appendChild(btn);
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });
}


/* ==========================================================================
   INDEX PAGE
   ========================================================================== */
function renderIndex() {
  _renderWisdom();
  _renderCategoryCards();
  _renderFeatured();
  _renderConservationOverview();
  _renderFunFacts();
  _shareBar('share-bar-home');
}

function _renderWisdom() {
  const box = document.getElementById('body-wisdom-box');
  if (!box) return;
  box.innerHTML = `<div class="summary-box--editorial">
    <p>${_t('wisdom.p1')}</p>
    <p>${_t('wisdom.p2')}</p>
    <p class="summary-cta">${_t('wisdom.p3')}</p>
  </div>`;
}

function _renderCategoryCards() {
  const grid = document.getElementById('category-cards');
  if (!grid) return;
  const cats = Data.getCategories();
  grid.innerHTML = cats.map(c => `<a href="${c.page}" class="card category-card" style="border-left-color:${c.color}">
    <span class="card-icon">${c.icon}</span>
    <div class="card-content">
      <span class="card-title">${_t(c.name_key)}</span>
      <div class="card-desc">${_t(c.desc_key)}</div>
      <span class="card-link" style="color:${c.color}">${_t(c.link_key)} →</span>
    </div>
  </a>`).join('');
}

function _renderFeatured() {
  const grid = document.getElementById('featured-cards');
  if (!grid) return;
  const featured = [
    { key: 'featured.top_predators', icon: '🦁', link: 'predators-prey.html' },
    { key: 'featured.fastest', icon: '💨', link: 'records-extremes.html' },
    { key: 'featured.endangered', icon: '🛡️', link: 'conservation.html' },
    { key: 'featured.best_parents', icon: '🐣', link: 'human-bonds.html' },
    { key: 'featured.superpowers', icon: '⚡', link: 'super-senses.html' }
  ];
  grid.innerHTML = featured.map(f => `<a href="${f.link}" class="featured-card">
    <div class="featured-icon">${f.icon}</div>
    <div class="featured-title">${_t(f.key)}</div>
  </a>`).join('');
}

function _renderConservationOverview() {
  const box = document.getElementById('conservation-chart-box');
  if (!box) return;
  const animals = Data.getAllAnimals();
  const statusCounts = {};
  animals.forEach(a => {
    statusCounts[a.conservation_status] = (statusCounts[a.conservation_status] || 0) + 1;
  });
  const statuses = Data.getConservationStatuses();
  const chartData = statuses.map(s => ({
    label: _t(s.name_key),
    count: statusCounts[s.id] || 0,
    color: s.color
  })).filter(d => d.count > 0);

  const statusIds = statuses.map(s => s.id);
  box.innerHTML = `<div class="econ-chart-box"><canvas id="conservation-chart"></canvas></div>
    <div class="conservation-status-legend" style="display:flex;flex-wrap:wrap;gap:1rem;justify-content:center;margin-top:1rem;">
      ${chartData.map((d, i) => `<a href="conservation.html?status=${statusIds[i]}" style="display:flex;align-items:center;gap:0.3rem;font-size:0.85rem;text-decoration:none;color:inherit;cursor:pointer;" class="conservation-legend-link">
        <span style="width:12px;height:12px;border-radius:50%;background:${d.color};display:inline-block;"></span>
        ${d.label}: <strong>${d.count}</strong>
      </a>`).join('')}
    </div>`;

  if (typeof Chart !== 'undefined') {
    const ctx = document.getElementById('conservation-chart').getContext('2d');
    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: chartData.map(d => d.label),
        datasets: [{
          data: chartData.map(d => d.count),
          backgroundColor: chartData.map(d => d.color),
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        cursor: 'pointer',
        plugins: {
          legend: { display: false }
        },
        onClick: (evt, elements) => {
          if (elements.length > 0) {
            const idx = elements[0].index;
            const sid = statuses.filter(s => (statusCounts[s.id] || 0) > 0)[idx];
            if (sid) window.location.href = 'conservation.html?status=' + sid.id;
          }
        },
        onHover: (evt, elements) => {
          evt.native.target.style.cursor = elements.length ? 'pointer' : 'default';
        }
      }
    });
  }
}

function _renderFunFacts() {
  const grid = document.getElementById('fun-facts-grid');
  if (!grid) return;
  const animals = Data.getAllAnimals();
  // Pick random fun facts
  const facts = [];
  const shuffled = animals.slice().sort(() => Math.random() - 0.5);
  for (const a of shuffled) {
    if (a.fun_facts && a.fun_facts.length > 0) {
      facts.push({ animal: a, fact: a.fun_facts[Math.floor(Math.random() * a.fun_facts.length)] });
      if (facts.length >= 6) break;
    }
  }
  grid.innerHTML = `<div class="cards-grid grid-3x2">${facts.map(f =>
    `<a href="animal-detail.html?id=${f.animal.id}" class="card fun-fact-card" style="text-decoration:none;color:inherit;">
      <span class="card-icon">${_animalIcon(f.animal)}</span>
      <span class="card-title">${_animalName(f.animal)}</span>
      <div class="card-description">${f.fact}</div>
    </a>`
  ).join('')}</div>`;
}


/* ==========================================================================
   PREDATORS & PREY
   ========================================================================== */
function renderPredatorsPrey() {
  const el = document.getElementById('predators-content');
  if (!el) return;

  const tabs = [
    { id: 'apex', key: 'predators.tab_apex', filter: a => a.ecosystem_role === 'apex_predator' },
    { id: 'ambush', key: 'predators.tab_ambush', filter: a => a.tags && a.tags.includes('ambush') },
    { id: 'pack', key: 'predators.tab_pack', filter: a => a.tags && (a.tags.includes('social') || a.tags.includes('pack_hunter')) },
    { id: 'prey', key: 'predators.tab_prey', filter: a => a.ecosystem_role === 'herbivore_grazer' }
  ];

  let activeTab = 'apex';

  function render() {
    const tab = tabs.find(t => t.id === activeTab);
    const animals = Data.getAllAnimals().filter(tab.filter);

    el.innerHTML = `
      <h1 class="page-title">${_t('predators.title')}</h1>
      <p class="page-intro">${_t('predators.subtitle')}</p>
      <div class="pillar-tabs">
        ${tabs.map(t => `<button class="pillar-tab ${t.id === activeTab ? 'active' : ''}" data-tab="${t.id}">${_t(t.key)}</button>`).join('')}
      </div>
      <div class="cards-grid grid-3x2">
        ${animals.map(a => {
          const strengths = (a.strengths || []).slice(0, 3).map(s => s.replace(/_/g, ' ')).join(', ');
          const weaknesses = (a.weaknesses || []).slice(0, 2).map(w => w.replace(/_/g, ' ')).join(', ');
          return `<a href="animal-detail.html?id=${a.id}" class="card pillar-card" style="border-left-color:#C62828">
            <div><span class="card-icon">${_animalIcon(a)}</span><span class="card-title">${_animalName(a)}</span></div>
            ${_classBadge(a.class)}
            <div class="card-description">
              <strong>${_t('predators.strengths')}:</strong> ${strengths}<br>
              <strong>${_t('predators.weaknesses')}:</strong> ${weaknesses}
            </div>
            <div class="card-avg">${_iucnBadge(a.conservation_status)} ${_t('detail.speed')}: ${a.stats.speed_kmh} km/h</div>
          </a>`;
        }).join('')}
      </div>`;

    el.querySelectorAll('.pillar-tab').forEach(btn => {
      btn.addEventListener('click', () => { activeTab = btn.dataset.tab; render(); });
    });
  }
  render();
}


/* ==========================================================================
   SUPER SENSES
   ========================================================================== */
function renderSuperSenses() {
  const el = document.getElementById('senses-content');
  if (!el) return;

  const senses = Data.getSenses();
  let activeSense = senses[0] ? senses[0].id : '';

  function render() {
    const sense = Data.getSense(activeSense);
    const animals = sense ? sense.animals.map(id => Data.getAnimal(id)).filter(Boolean) : [];

    el.innerHTML = `
      <h1 class="page-title">${_t('senses.title')}</h1>
      <p class="page-intro">${_t('senses.subtitle')}</p>
      <div class="pillar-tabs">
        ${senses.map(s => `<button class="pillar-tab ${s.id === activeSense ? 'active' : ''}" data-tab="${s.id}" style="${s.id === activeSense ? 'background:' + s.color + ';border-color:' + s.color : ''}">${s.icon} ${_t(s.name_key)}</button>`).join('')}
      </div>
      ${sense ? `
        <div class="content-section">
          <h2>${sense.icon} ${_t(sense.name_key)}</h2>
          <p>${_t(sense.how_it_works_key)}</p>
          <div style="margin:1rem 0;font-size:0.9rem;color:var(--text-gray)">
            <strong>${_t('senses.human_equivalent') || 'Human equivalent'}:</strong> ${sense.human_equivalent}<br>
            <strong>${_t('senses.range') || 'Range'}:</strong> ${sense.range}
          </div>
        </div>
        <h3>${_t('senses.animals_with')}</h3>
        <div class="cards-grid grid-3x2">
          ${animals.map(a => _animalCard(a, { color: sense.color })).join('')}
        </div>
      ` : ''}`;

    el.querySelectorAll('.pillar-tab').forEach(btn => {
      btn.addEventListener('click', () => { activeSense = btn.dataset.tab; render(); });
    });
  }
  render();
}


/* ==========================================================================
   HUMAN BONDS
   ========================================================================== */
function renderHumanBonds() {
  const el = document.getElementById('human-content');
  if (!el) return;

  const relations = Data.getHumanRelations();
  let activeRel = relations[0] ? relations[0].id : '';

  function render() {
    const rel = Data.getHumanRelation(activeRel);
    const animals = rel ? rel.examples.map(id => Data.getAnimal(id)).filter(Boolean) : [];

    el.innerHTML = `
      <h1 class="page-title">${_t('human.title')}</h1>
      <p class="page-intro">${_t('human.subtitle')}</p>
      <div class="pillar-tabs">
        ${relations.map(r => `<button class="pillar-tab ${r.id === activeRel ? 'active' : ''}" data-tab="${r.id}" style="${r.id === activeRel ? 'background:' + r.color + ';border-color:' + r.color : ''}">${r.icon} ${_t(r.name_key)}</button>`).join('')}
      </div>
      ${rel ? `
        <div class="content-section">
          <p>${_t(rel.description_key)}</p>
        </div>
        <div class="cards-grid grid-3x2">
          ${animals.map(a => {
            const danger = a.human_relation ? a.human_relation.danger_level : 1;
            return `<a href="animal-detail.html?id=${a.id}" class="card pillar-card" style="border-left-color:${rel.color}">
              <div><span class="card-icon">${_animalIcon(a)}</span><span class="card-title">${_animalName(a)}</span></div>
              ${_classBadge(a.class)}
              <div class="card-description">${_t('human.danger_level')}: ${_dangerDots(danger)}</div>
              <div class="card-avg">${_iucnBadge(a.conservation_status)}</div>
            </a>`;
          }).join('')}
        </div>
      ` : ''}`;

    el.querySelectorAll('.pillar-tab').forEach(btn => {
      btn.addEventListener('click', () => { activeRel = btn.dataset.tab; render(); });
    });
  }
  render();
}


/* ==========================================================================
   ECOSYSTEM ROLES
   ========================================================================== */
function renderEcosystemRoles() {
  const el = document.getElementById('ecosystem-content');
  if (!el) return;

  const roles = Data.getEcosystemRoles();
  let activeRole = roles[0] ? roles[0].id : '';

  function render() {
    const role = Data.getEcosystemRole(activeRole);
    const animals = role ? role.examples.map(id => Data.getAnimal(id)).filter(Boolean) : [];

    el.innerHTML = `
      <h1 class="page-title">${_t('ecosystem.title')}</h1>
      <p class="page-intro">${_t('ecosystem.subtitle')}</p>
      <div class="pillar-tabs">
        ${roles.map(r => `<button class="pillar-tab ${r.id === activeRole ? 'active' : ''}" data-tab="${r.id}" style="${r.id === activeRole ? 'background:' + r.color + ';border-color:' + r.color : ''}">${r.icon} ${_t(r.name_key)}</button>`).join('')}
      </div>
      ${role ? `
        <div class="content-section">
          <h2>${role.icon} ${_t(role.name_key)}</h2>
          <p>${_t(role.description_key)}</p>
          <p><em>${_t(role.importance_key)}</em></p>
        </div>
        <div class="cards-grid grid-3x2">
          ${animals.map(a => _animalCard(a, { color: role.color, subtitle: _t('class.' + a.class) })).join('')}
        </div>
      ` : ''}`;

    el.querySelectorAll('.pillar-tab').forEach(btn => {
      btn.addEventListener('click', () => { activeRole = btn.dataset.tab; render(); });
    });
  }
  render();
}


/* ==========================================================================
   RECORDS & EXTREMES
   ========================================================================== */
function renderRecordsExtremes() {
  const el = document.getElementById('records-content');
  if (!el) return;

  const records = Data.getRecords();
  const categories = [...new Set(records.map(r => r.category))];
  let activeCat = categories[0] || 'speed';

  function render() {
    const catRecords = records.filter(r => r.category === activeCat);

    el.innerHTML = `
      <h1 class="page-title">${_t('records.title')}</h1>
      <p class="page-intro">${_t('records.subtitle')}</p>
      <div class="pillar-tabs">
        ${categories.map(c => `<button class="pillar-tab ${c === activeCat ? 'active' : ''}" data-tab="${c}">${c.charAt(0).toUpperCase() + c.slice(1)}</button>`).join('')}
      </div>
      <div class="records-list">
        ${catRecords.map(r => {
          const animal = Data.getAnimal(r.animal_id);
          const runnersUp = (r.runners_up || []).map(id => Data.getAnimal(id)).filter(Boolean);
          return `<div class="content-section">
            <h2>${r.icon} ${_t(r.name_key)}</h2>
            ${animal ? `<div class="card" style="border-left-color:#E65100;margin-bottom:1rem;">
              <div><span class="card-icon" style="font-size:2rem">${_animalIcon(animal)}</span>
              <span class="card-title" style="font-size:1.2rem">${_animalName(animal)}</span></div>
              <div class="card-value">${r.value}</div>
              <p class="card-description">${_t(r.description_key)}</p>
            </div>` : ''}
            ${runnersUp.length ? `<div style="margin-top:0.5rem">
              <strong>${_t('records.runners_up') || 'Runners-up'}:</strong>
              <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-top:0.5rem">
                ${runnersUp.map(a => `<a href="animal-detail.html?id=${a.id}" class="food-chip">${_animalIcon(a)} ${_animalName(a)}</a>`).join('')}
              </div>
            </div>` : ''}
          </div>`;
        }).join('')}
      </div>`;

    el.querySelectorAll('.pillar-tab').forEach(btn => {
      btn.addEventListener('click', () => { activeCat = btn.dataset.tab; render(); });
    });
  }
  render();
}


/* ==========================================================================
   CONSERVATION
   ========================================================================== */
function renderConservation() {
  const el = document.getElementById('conservation-content');
  if (!el) return;

  const tabs = ['status', 'threats', 'success'];
  let activeTab = 'status';

  // Support deep-link: conservation.html?status=EN scrolls to that status
  const params = new URLSearchParams(window.location.search);
  const deepStatus = params.get('status');

  function render() {
    el.innerHTML = `
      <h1 class="page-title">${_t('conservation.title')}</h1>
      <p class="page-intro">${_t('conservation.subtitle')}</p>
      <div class="pillar-tabs">
        ${tabs.map(t => `<button class="pillar-tab ${t === activeTab ? 'active' : ''}" data-tab="${t}">${_t('conservation.tab_' + t)}</button>`).join('')}
      </div>
      <div id="conservation-tab-content"></div>`;

    const content = document.getElementById('conservation-tab-content');

    if (activeTab === 'status') {
      const statuses = Data.getConservationStatuses();
      content.innerHTML = statuses.map(s => {
        const animals = Data.getAnimalsByConservationStatus(s.id);
        return `<div class="content-section" id="status-${s.id}">
          <h2><span class="iucn-badge" style="background:${s.color}">${s.id}</span> ${_t(s.name_key)} <span style="color:var(--text-gray);font-weight:normal">(${animals.length})</span></h2>
          ${animals.length ? `<div class="cards-grid grid-4x2">
            ${animals.map(a => `<a href="animal-detail.html?id=${a.id}" class="card overview-card" style="border-left-color:${s.color}">
              <span class="card-icon">${_animalIcon(a)}</span>
              <div>
                <span class="card-title">${_animalName(a)}</span>
                <div style="margin-top:0.25rem">${_classBadge(a.class)}</div>
              </div>
            </a>`).join('')}
          </div>` : `<p style="color:var(--text-gray)">${_t('site.no_results')}</p>`}
        </div>`;
      }).join('');

      // Scroll to deep-linked status
      if (deepStatus) {
        const target = document.getElementById('status-' + deepStatus);
        if (target) {
          setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
        }
      }
    } else if (activeTab === 'threats') {
      const threats = Data.getConservationThreats();
      content.innerHTML = threats.map(t => {
        const animals = (t.affected_animals || []).map(id => Data.getAnimal(id)).filter(Boolean);
        return `<div class="content-section">
          <h2>${t.icon} ${_t(t.name_key)}</h2>
          <div class="cards-grid grid-4x2" style="margin-top:0.5rem">
            ${animals.map(a => `<a href="animal-detail.html?id=${a.id}" class="card overview-card">
              <span class="card-icon">${_animalIcon(a)}</span>
              <div>
                <span class="card-title">${_animalName(a)}</span>
                <div style="margin-top:0.25rem">${_iucnBadge(a.conservation_status)}</div>
              </div>
            </a>`).join('')}
          </div>
        </div>`;
      }).join('');
    } else if (activeTab === 'success') {
      const stories = Data.getConservationSuccessStories();
      content.innerHTML = stories.map(s => {
        const animal = Data.getAnimal(s.animal_id);
        return `<div class="card" style="border-left-color:#2E7D32;margin-bottom:1rem;padding:1.5rem;">
          ${animal ? `<a href="animal-detail.html?id=${animal.id}" style="display:flex;align-items:center;gap:0.75rem;text-decoration:none;color:inherit;margin-bottom:0.75rem;">
            <span style="font-size:2rem">${_animalIcon(animal)}</span>
            <div><span class="card-title" style="font-size:1.1rem">${_animalName(animal)}</span>
            <div style="margin-top:0.25rem">${_classBadge(animal.class)}</div></div>
          </a>` : ''}
          <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">
            <span class="iucn-badge" style="background:${Data.getIUCNColor(s.from_status)}">${s.from_status}</span>
            <span style="font-size:1.2rem">→</span>
            <span class="iucn-badge" style="background:${Data.getIUCNColor(s.to_status)}">${s.to_status}</span>
            <span style="color:var(--text-gray);margin-left:0.5rem">(${s.year})</span>
          </div>
        </div>`;
      }).join('');
    }

    el.querySelectorAll('.pillar-tab').forEach(btn => {
      btn.addEventListener('click', () => { activeTab = btn.dataset.tab; render(); });
    });
  }
  render();
}


/* ==========================================================================
   ANIMAL DETAIL
   ========================================================================== */
function renderAnimalDetail() {
  const el = document.getElementById('animal-detail-content');
  if (!el) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    // Show animal browse
    const animals = Data.getAllAnimals();
    const lang = I18n.getLang();
    const sorted = animals.map(a => ({ animal: a, name: _animalName(a) }))
      .sort((a, b) => a.name.localeCompare(b.name, lang));
    el.innerHTML = `
      <h1 class="page-title">${_t('nav.animal_search')}</h1>
      <div class="food-browse-grid">
        ${sorted.map(({ animal: a, name }) =>
          `<a href="animal-detail.html?id=${a.id}" class="card food-browse-card">
            <span class="food-browse-icon">${_animalIcon(a)}</span>
            <span class="food-browse-name">${name}</span>
            ${_classBadge(a.class)}
          </a>`
        ).join('')}
      </div>`;
    return;
  }

  const animal = Data.getAnimal(id);
  if (!animal) {
    el.innerHTML = `<div class="not-found">${_t('error.animal_not_found') || 'Animal not found.'}</div>`;
    return;
  }

  const name = _animalName(animal);
  const s = animal.stats || {};
  const senses = animal.senses || {};
  const related = Data.getRelatedAnimals(id);

  el.innerHTML = `
    <div class="food-detail-header">
      <h1 class="page-title">${_animalIcon(animal)} ${name}</h1>
      <div class="food-tags-row">
        ${_classBadge(animal.class)}
        ${_iucnBadge(animal.conservation_status)}
        <span class="tag">${_t('diet.' + animal.diet)}</span>
        ${(animal.habitat || []).map(h => `<span class="tag">${_t('habitat.' + h)}</span>`).join('')}
      </div>
      <p style="font-style:italic;color:var(--text-gray);margin-bottom:0.5rem">${animal.scientific_name}</p>
      <p style="color:var(--text-gray)">${_t('detail.continent')}: ${(animal.continent || []).map(c => _t('continent.' + c)).join(', ')}</p>
    </div>

    <!-- Stats -->
    <div class="content-section">
      <h2>${_t('detail.stats')}</h2>
      <div class="econ-metrics">
        <div class="econ-metric"><div class="econ-metric-label">${_t('detail.weight')}</div><div class="econ-metric-value">${s.weight_kg ? s.weight_kg + ' kg' : '—'}</div></div>
        <div class="econ-metric"><div class="econ-metric-label">${_t('detail.speed')}</div><div class="econ-metric-value">${s.speed_kmh ? s.speed_kmh + ' km/h' : '—'}</div></div>
        <div class="econ-metric"><div class="econ-metric-label">${_t('detail.lifespan')}</div><div class="econ-metric-value">${s.lifespan_years ? s.lifespan_years + ' yr' : '—'}</div></div>
      </div>
      ${_statBar(_t('detail.speed'), s.speed_kmh || 0, 400, 'km/h', '#E65100')}
      ${_statBar(_t('detail.weight'), Math.min(s.weight_kg || 0, 5000), 5000, 'kg', '#BF6A1F')}
      ${_statBar(_t('detail.lifespan'), s.lifespan_years || 0, 120, 'yr', '#1A6B5C')}
    </div>

    <!-- Strengths & Weaknesses -->
    <div class="content-section">
      <h2>${_t('detail.strengths')}</h2>
      <ul>${(animal.strengths || []).map(s => `<li>${s.replace(/_/g, ' ')}</li>`).join('')}</ul>
      <h2 style="margin-top:1rem">${_t('detail.weaknesses')}</h2>
      <ul class="avoid-list">${(animal.weaknesses || []).map(w => `<li>${w.replace(/_/g, ' ')}</li>`).join('')}</ul>
    </div>

    <!-- Senses -->
    <div class="content-section">
      <h2>${_t('detail.senses')}</h2>
      <div class="sense-radar"><canvas id="sense-radar-chart"></canvas></div>
      ${senses.special && senses.special.length ? `<p style="margin-top:1rem"><strong>${_t('detail.senses.special')}:</strong> ${senses.special.map(s => s.replace(/_/g, ' ')).join(', ')}</p>` : ''}
    </div>

    <!-- Human Relationship -->
    <div class="content-section">
      <h2>${_t('detail.human_relation')}</h2>
      <p>${_t('human.relation_type')}: <strong>${animal.human_relation ? _t('human.tab_' + animal.human_relation.type) || animal.human_relation.type : '—'}</strong></p>
      <p>${_t('detail.danger_level')}: ${_dangerDots(animal.human_relation ? animal.human_relation.danger_level : 0)}</p>
    </div>

    <!-- Ecosystem Role -->
    <div class="content-section">
      <h2>${_t('detail.ecosystem_role')}</h2>
      <p>${animal.ecosystem_role ? animal.ecosystem_role.replace(/_/g, ' ') : '—'}</p>
    </div>

    <!-- Fun Facts -->
    <div class="content-section">
      <h2>${_t('detail.fun_facts')}</h2>
      <ul>${(animal.fun_facts || []).map(f => `<li>${f}</li>`).join('')}</ul>
    </div>

    <!-- Related Animals -->
    ${related.length ? `<div class="content-section">
      <h2>${_t('detail.related')}</h2>
      <div class="age-benefit-chips">
        ${related.map(a => `<a href="animal-detail.html?id=${a.id}" class="food-chip">${_animalIcon(a)} ${_animalName(a)}</a>`).join('')}
      </div>
    </div>` : ''}
  `;

  // Render senses radar chart
  if (typeof Chart !== 'undefined') {
    const ctx = document.getElementById('sense-radar-chart');
    if (ctx) {
      new Chart(ctx.getContext('2d'), {
        type: 'radar',
        data: {
          labels: [_t('detail.senses.vision'), _t('detail.senses.hearing'), _t('detail.senses.smell'), _t('detail.senses.taste'), _t('detail.senses.touch')],
          datasets: [{
            label: name,
            data: [senses.vision || 0, senses.hearing || 0, senses.smell || 0, senses.taste || 0, senses.touch || 0],
            borderColor: '#BF6A1F',
            backgroundColor: 'rgba(191,106,31,0.2)',
            borderWidth: 2,
            pointBackgroundColor: '#BF6A1F'
          }]
        },
        options: {
          responsive: true,
          scales: {
            r: { min: 0, max: 5, ticks: { stepSize: 1 } }
          },
          plugins: { legend: { display: false } }
        }
      });
    }
  }
}


/* ==========================================================================
   COMPARE
   ========================================================================== */
function renderCompare() {
  const el = document.getElementById('compare-content');
  if (!el) return;

  const animals = Data.getAllAnimals();
  const lang = I18n.getLang();
  const sorted = animals.slice().sort((a, b) => _animalName(a).localeCompare(_animalName(b), lang));

  const params = new URLSearchParams(window.location.search);
  let sel1 = params.get('a') || '';
  let sel2 = params.get('b') || '';
  let sel3 = params.get('c') || '';

  function render() {
    const options = sorted.map(a => `<option value="${a.id}">${_animalIcon(a)} ${_animalName(a)}</option>`).join('');

    el.innerHTML = `
      <h1 class="page-title">${_t('compare.title')}</h1>
      <p class="page-intro">${_t('compare.subtitle')}</p>
      <div class="compare-controls">
        <div class="compare-selector">
          <label>${_t('compare.select_first')}</label>
          <select class="food-select" id="compare-a"><option value="">—</option>${options}</select>
        </div>
        <div class="compare-selector">
          <label>${_t('compare.select_second')}</label>
          <select class="food-select" id="compare-b"><option value="">—</option>${options}</select>
        </div>
        <div class="compare-selector">
          <label>${_t('compare.select_third')}</label>
          <select class="food-select" id="compare-c"><option value="">—</option>${options}</select>
        </div>
        <button class="compare-btn" id="compare-go">${_t('compare.btn')}</button>
      </div>
      <div id="compare-results"></div>`;

    if (sel1) document.getElementById('compare-a').value = sel1;
    if (sel2) document.getElementById('compare-b').value = sel2;
    if (sel3) document.getElementById('compare-c').value = sel3;

    document.getElementById('compare-go').addEventListener('click', () => {
      sel1 = document.getElementById('compare-a').value;
      sel2 = document.getElementById('compare-b').value;
      sel3 = document.getElementById('compare-c').value;
      _renderComparison(sel1, sel2, sel3);
    });

    if (sel1 && sel2) _renderComparison(sel1, sel2, sel3);
  }

  function _renderComparison(id1, id2, id3) {
    const box = document.getElementById('compare-results');
    const selected = [id1, id2, id3].map(id => Data.getAnimal(id)).filter(Boolean);
    if (selected.length < 2) {
      box.innerHTML = `<div class="compare-hint">${_t('compare.hint')}</div>`;
      return;
    }

    const colors = ['#BF6A1F', '#1A6B5C', '#6A1B9A'];

    // Stats comparison bars
    const statKeys = [
      { key: 'speed_kmh', label: _t('detail.speed'), unit: 'km/h', max: 400 },
      { key: 'weight_kg', label: _t('detail.weight'), unit: 'kg', max: Math.max(...selected.map(a => a.stats.weight_kg || 0)) * 1.2 || 1000 },
      { key: 'lifespan_years', label: _t('detail.lifespan'), unit: 'yr', max: 120 },
      { key: 'height_cm', label: _t('detail.height'), unit: 'cm', max: Math.max(...selected.map(a => a.stats.height_cm || 0)) * 1.2 || 500 }
    ];

    box.innerHTML = `
      <div class="compare-section">
        <h2>${_t('compare.stats')}</h2>
        ${statKeys.map(sk => `<div class="compare-bar-row">
          <div class="compare-bar-label">${sk.label}</div>
          <div class="compare-bar-group">
            ${selected.map((a, i) => {
              const val = a.stats[sk.key] || 0;
              const pct = sk.max > 0 ? Math.min((val / sk.max) * 100, 100) : 0;
              return `<div class="compare-bar-entry">
                <span class="compare-bar-name">${_animalIcon(a)} ${_animalName(a)}</span>
                <div class="compare-bar-track"><div class="compare-bar-fill" style="width:${pct}%;background:${colors[i]}"></div></div>
                <span class="compare-bar-value">${val} ${sk.unit}</span>
              </div>`;
            }).join('')}
          </div>
        </div>`).join('')}
      </div>
      <div class="compare-section">
        <h2>${_t('compare.senses')}</h2>
        <div class="compare-radar-wrap"><canvas id="compare-radar"></canvas></div>
      </div>`;

    // Radar chart
    if (typeof Chart !== 'undefined') {
      const ctx = document.getElementById('compare-radar');
      if (ctx) {
        new Chart(ctx.getContext('2d'), {
          type: 'radar',
          data: {
            labels: [_t('detail.senses.vision'), _t('detail.senses.hearing'), _t('detail.senses.smell'), _t('detail.senses.taste'), _t('detail.senses.touch')],
            datasets: selected.map((a, i) => ({
              label: _animalName(a),
              data: [a.senses.vision || 0, a.senses.hearing || 0, a.senses.smell || 0, a.senses.taste || 0, a.senses.touch || 0],
              borderColor: colors[i],
              backgroundColor: colors[i] + '33',
              borderWidth: 2,
              pointBackgroundColor: colors[i]
            }))
          },
          options: {
            responsive: true,
            scales: { r: { min: 0, max: 5, ticks: { stepSize: 1 } } }
          }
        });
      }
    }
  }
  render();
}


/* ==========================================================================
   WORLD MAP
   ========================================================================== */
function renderWorldMap() {
  const el = document.getElementById('map-content');
  if (!el) return;

  const continents = [
    { id: 'north_america', name_key: 'continent.north_america', color: '#2E7D32', x: 17, y: 28 },
    { id: 'south_america', name_key: 'continent.south_america', color: '#6A1B9A', x: 25, y: 68 },
    { id: 'europe', name_key: 'continent.europe', color: '#1565C0', x: 47, y: 18 },
    { id: 'africa', name_key: 'continent.africa', color: '#C62828', x: 49, y: 52 },
    { id: 'asia', name_key: 'continent.asia', color: '#E65100', x: 66, y: 24 },
    { id: 'oceania', name_key: 'continent.oceania', color: '#00838F', x: 82, y: 66 },
    { id: 'antarctica', name_key: 'continent.antarctica', color: '#78909C', x: 50, y: 93 }
  ];

  let activeContinent = '';
  let activeHabitat = '';

  // Get top animals per continent for map display (cached for stable results)
  const _mapAnimalCache = {};
  function _getMapAnimals(continentId) {
    if (!_mapAnimalCache[continentId]) {
      _mapAnimalCache[continentId] = Data.getAllAnimals()
        .filter(a => a.continent && a.continent.includes(continentId))
        .sort((a, b) => a.id.localeCompare(b.id))
        .slice(0, 5);
    }
    return _mapAnimalCache[continentId];
  }

  function render() {
    let filtered = Data.getAllAnimals();
    if (activeContinent) filtered = filtered.filter(a => a.continent && a.continent.includes(activeContinent));
    if (activeHabitat) filtered = filtered.filter(a => a.habitat && a.habitat.includes(activeHabitat));

    const habitats = Data.getHabitats();

    // Build emoji clusters for each continent
    const emojiOffsets = [
      { dx: -3, dy: 3 }, { dx: 0, dy: 4.5 }, { dx: 3, dy: 3 }, { dx: -1.5, dy: 6 }, { dx: 1.5, dy: 6 }
    ];

    el.innerHTML = `
      <h1 class="page-title">${_t('map.title')}</h1>
      <p class="page-intro">${_t('map.subtitle')}</p>

      <div class="continent-map" style="position:relative;border-radius:12px;margin-bottom:2rem;overflow:hidden;background:linear-gradient(180deg, #dceef8 0%, #c8e0d4 40%, #e8dfc8 100%);">
        <div style="position:relative;width:100%;padding-bottom:50%;">
          <img src="img/world-map.svg" alt="" style="position:absolute;inset:0;width:100%;height:100%;color:#5a7d6a;pointer-events:none;">
          ${continents.map(c => {
            const mapAnimals = _getMapAnimals(c.id);
            const isActive = activeContinent === c.id;
            const dimmed = activeContinent && !isActive;
            const count = Data.getAnimalsByContinent(c.id).length;
            return `<div data-continent="${c.id}" style="position:absolute;left:${c.x}%;top:${c.y}%;transform:translate(-50%,-50%);text-align:center;cursor:pointer;transition:filter 0.3s;z-index:1;${dimmed ? 'filter:grayscale(100%) opacity(0.5);' : ''}">
              <div style="font-weight:${isActive ? '700' : '600'};font-size:${isActive ? '0.85rem' : '0.72rem'};color:${c.color};text-shadow:0 1px 3px rgba(255,255,255,0.95);white-space:nowrap;">${_t(c.name_key)}</div>
              <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:1px;max-width:100px;margin:0 auto;">${mapAnimals.map(a => `<span style="font-size:1.1rem;" title="${_animalName(a)}">${a.emoji || '🐾'}</span>`).join('')}</div>
              <div style="font-size:0.65rem;color:${c.color};text-shadow:0 1px 2px rgba(255,255,255,0.9);font-weight:600;">${count}</div>
            </div>`;
          }).join('')}
        </div>
      </div>

      <div style="display:flex;gap:1rem;flex-wrap:wrap;margin-bottom:2rem;">
        <div class="pillar-tabs">
          <button class="pillar-tab ${!activeContinent ? 'active' : ''}" data-continent="">${_t('map.all_continents')}</button>
          ${continents.map(c => `<button class="pillar-tab ${activeContinent === c.id ? 'active' : ''}" data-continent="${c.id}" style="${activeContinent === c.id ? 'background:' + c.color + ';border-color:' + c.color : ''}">${_t(c.name_key)} (${Data.getAnimalsByContinent(c.id).length})</button>`).join('')}
        </div>
      </div>

      <div style="margin-bottom:1rem">
        <select class="food-select" id="habitat-filter">
          <option value="">${_t('map.all_habitats')}</option>
          ${habitats.map(h => `<option value="${h.id}" ${activeHabitat === h.id ? 'selected' : ''}>${h.icon} ${_t(h.name_key)}</option>`).join('')}
        </select>
      </div>

      <p style="color:var(--text-gray);margin-bottom:1rem"><strong>${filtered.length}</strong> ${_t('map.animals_found')}</p>

      <div class="cards-grid grid-4x2">
        ${filtered.sort((a, b) => _animalName(a).localeCompare(_animalName(b), I18n.getLang())).map(a => `<a href="animal-detail.html?id=${a.id}" class="card overview-card">
          <span class="card-icon">${_animalIcon(a)}</span>
          <div>
            <span class="card-title">${_animalName(a)}</span>
            <div style="margin-top:0.25rem">${_classBadge(a.class)} ${_iucnBadge(a.conservation_status)}</div>
            <div style="margin-top:0.2rem;font-size:0.75rem;color:var(--text-gray)">${(a.continent || []).map(c => _t('continent.' + c)).join(', ')}</div>
          </div>
        </a>`).join('')}
      </div>`;

    el.querySelectorAll('[data-continent]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeContinent = btn.dataset.continent;
        render();
      });
    });

    const habSelect = document.getElementById('habitat-filter');
    if (habSelect) {
      habSelect.addEventListener('change', () => {
        activeHabitat = habSelect.value;
        render();
      });
    }
  }
  render();
}


/* ==========================================================================
   QUIZ
   ========================================================================== */
function renderQuiz() {
  const el = document.getElementById('quiz-content');
  if (!el) return;

  let state = 'start'; // start, play, results
  let questions = [];
  let current = 0;
  let score = 0;
  let answered = false;

  function generateQuestions() {
    const animals = Data.getAllAnimals();
    const qs = [];

    // Type 1: Which animal is fastest?
    const bySpeed = animals.filter(a => a.stats && a.stats.speed_kmh > 0).sort((a, b) => b.stats.speed_kmh - a.stats.speed_kmh);
    if (bySpeed.length >= 4) {
      const correct = bySpeed[0];
      const wrong = _pickRandom(bySpeed.slice(1), 3);
      qs.push({
        q: `Which animal is the fastest on land?`,
        options: _shuffle([correct, ...wrong]),
        correct: correct.id,
        explanation: `${_animalName(correct)} can reach ${correct.stats.speed_kmh} km/h!`
      });
    }

    // Type 2: Which animal is endangered?
    const endangered = animals.filter(a => a.conservation_status === 'CR');
    const notEndangered = animals.filter(a => a.conservation_status === 'LC');
    if (endangered.length >= 1 && notEndangered.length >= 3) {
      const correct = _pickRandom(endangered, 1)[0];
      const wrong = _pickRandom(notEndangered, 3);
      qs.push({
        q: `Which of these animals is Critically Endangered?`,
        options: _shuffle([correct, ...wrong]),
        correct: correct.id,
        explanation: `${_animalName(correct)} is classified as Critically Endangered by the IUCN.`
      });
    }

    // Type 3: Which has echolocation?
    const withEcho = animals.filter(a => a.senses && a.senses.special && a.senses.special.includes('echolocation'));
    const withoutEcho = animals.filter(a => !a.senses || !a.senses.special || !a.senses.special.includes('echolocation'));
    if (withEcho.length >= 1 && withoutEcho.length >= 3) {
      const correct = _pickRandom(withEcho, 1)[0];
      const wrong = _pickRandom(withoutEcho, 3);
      qs.push({
        q: `Which animal uses echolocation?`,
        options: _shuffle([correct, ...wrong]),
        correct: correct.id,
        explanation: `${_animalName(correct)} uses echolocation to navigate and find food.`
      });
    }

    // Type 4: Which is heaviest?
    const byWeight = animals.filter(a => a.stats && a.stats.weight_kg > 0).sort((a, b) => b.stats.weight_kg - a.stats.weight_kg);
    if (byWeight.length >= 4) {
      const correct = byWeight[0];
      const wrong = _pickRandom(byWeight.slice(3), 3);
      qs.push({
        q: `Which animal is the heaviest?`,
        options: _shuffle([correct, ...wrong]),
        correct: correct.id,
        explanation: `${_animalName(correct)} weighs up to ${correct.stats.weight_kg.toLocaleString()} kg!`
      });
    }

    // Type 5: Which is a mammal?
    const mammals = animals.filter(a => a.class === 'mammal');
    const nonMammals = animals.filter(a => a.class !== 'mammal');
    if (mammals.length >= 1 && nonMammals.length >= 3) {
      const correct = _pickRandom(mammals, 1)[0];
      const wrong = _pickRandom(nonMammals, 3);
      qs.push({
        q: `Which of these is a mammal?`,
        options: _shuffle([correct, ...wrong]),
        correct: correct.id,
        explanation: `${_animalName(correct)} is a ${_t('class.mammal').toLowerCase()}.`
      });
    }

    // Type 6: Danger level question
    const dangerous = animals.filter(a => a.human_relation && a.human_relation.danger_level >= 4);
    const safe = animals.filter(a => a.human_relation && a.human_relation.danger_level <= 2);
    if (dangerous.length >= 1 && safe.length >= 3) {
      const correct = _pickRandom(dangerous, 1)[0];
      const wrong = _pickRandom(safe, 3);
      qs.push({
        q: `Which animal is considered dangerous to humans?`,
        options: _shuffle([correct, ...wrong]),
        correct: correct.id,
        explanation: `${_animalName(correct)} has a danger level of ${correct.human_relation.danger_level}/5.`
      });
    }

    // Type 7: Longest-lived
    const byLife = animals.filter(a => a.stats && a.stats.lifespan_years > 0).sort((a, b) => b.stats.lifespan_years - a.stats.lifespan_years);
    if (byLife.length >= 4) {
      const correct = byLife[0];
      const wrong = _pickRandom(byLife.slice(3), 3);
      qs.push({
        q: `Which animal lives the longest?`,
        options: _shuffle([correct, ...wrong]),
        correct: correct.id,
        explanation: `${_animalName(correct)} can live up to ${correct.stats.lifespan_years} years!`
      });
    }

    // Type 8: Which is a bird?
    const birds = animals.filter(a => a.class === 'bird');
    const nonBirds = animals.filter(a => a.class !== 'bird');
    if (birds.length >= 1 && nonBirds.length >= 3) {
      const correct = _pickRandom(birds, 1)[0];
      const wrong = _pickRandom(nonBirds, 3);
      qs.push({
        q: `Which of these is a bird?`,
        options: _shuffle([correct, ...wrong]),
        correct: correct.id,
        explanation: `${_animalName(correct)} belongs to the bird class.`
      });
    }

    // Type 9: Habitat question
    const oceanAnimals = animals.filter(a => a.habitat && a.habitat.includes('ocean'));
    const landAnimals = animals.filter(a => a.habitat && !a.habitat.includes('ocean'));
    if (oceanAnimals.length >= 1 && landAnimals.length >= 3) {
      const correct = _pickRandom(oceanAnimals, 1)[0];
      const wrong = _pickRandom(landAnimals, 3);
      qs.push({
        q: `Which animal lives in the ocean?`,
        options: _shuffle([correct, ...wrong]),
        correct: correct.id,
        explanation: `${_animalName(correct)} is found in ocean habitats.`
      });
    }

    // Type 10: Fun fact true/false style
    const withFacts = animals.filter(a => a.fun_facts && a.fun_facts.length > 0);
    if (withFacts.length >= 4) {
      const factAnimal = _pickRandom(withFacts, 1)[0];
      const wrong = _pickRandom(withFacts.filter(a => a.id !== factAnimal.id), 3);
      qs.push({
        q: `"${factAnimal.fun_facts[0]}" — Which animal is this about?`,
        options: _shuffle([factAnimal, ...wrong]),
        correct: factAnimal.id,
        explanation: `This fact is about ${_animalName(factAnimal)}.`
      });
    }

    return _shuffle(qs).slice(0, 10);
  }

  function _pickRandom(arr, n) {
    const shuffled = arr.slice().sort(() => Math.random() - 0.5);
    return shuffled.slice(0, n);
  }

  function _shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function render() {
    if (state === 'start') {
      el.innerHTML = `<div class="quiz-start-screen">
        <div class="quiz-icon">🐾</div>
        <h1>${_t('quiz.title')}</h1>
        <p>${_t('quiz.subtitle')}</p>
        <p style="color:var(--text-gray)">${_t('quiz.questions')}</p>
        <button class="quiz-start-btn" id="quiz-start-btn">${_t('quiz.start')}</button>
      </div>`;
      document.getElementById('quiz-start-btn').addEventListener('click', () => {
        questions = generateQuestions();
        current = 0;
        score = 0;
        answered = false;
        state = 'play';
        render();
      });
    } else if (state === 'play') {
      const q = questions[current];
      if (!q) { state = 'results'; render(); return; }
      const pct = ((current) / questions.length) * 100;

      el.innerHTML = `<div class="quiz-play-screen">
        <div class="quiz-header">
          <span class="quiz-progress-text">${_t('quiz.question_of').replace('{n}', current + 1).replace('{total}', questions.length)}</span>
          <span class="quiz-score-display">${_t('quiz.score')}: ${score}</span>
        </div>
        <div class="quiz-progress-bar"><div class="quiz-progress-fill" style="width:${pct}%"></div></div>
        <div class="quiz-question-text">${q.q}</div>
        <div class="quiz-options">
          ${q.options.map(a => `<button class="quiz-option-btn" data-id="${a.id}">${_animalIcon(a)} ${_animalName(a)}</button>`).join('')}
        </div>
        <div id="quiz-feedback"></div>
      </div>`;

      el.querySelectorAll('.quiz-option-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (answered) return;
          answered = true;
          const chosen = btn.dataset.id;
          const isCorrect = chosen === q.correct;
          if (isCorrect) score++;

          el.querySelectorAll('.quiz-option-btn').forEach(b => {
            b.disabled = true;
            if (b.dataset.id === q.correct) b.classList.add('quiz-correct');
            if (b.dataset.id === chosen && !isCorrect) b.classList.add('quiz-wrong');
          });

          const fb = document.getElementById('quiz-feedback');
          fb.innerHTML = `<div class="quiz-feedback ${isCorrect ? 'quiz-feedback-correct' : 'quiz-feedback-wrong'}">
            ${isCorrect ? '✓ ' : '✗ '}${q.explanation}
          </div>
          <button class="quiz-next-btn" id="quiz-next">${current < questions.length - 1 ? _t('quiz.next') : _t('quiz.results')}</button>`;

          document.getElementById('quiz-next').addEventListener('click', () => {
            current++;
            answered = false;
            if (current >= questions.length) state = 'results';
            render();
          });
        });
      });
    } else if (state === 'results') {
      const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
      let emoji, msg;
      if (pct === 100) { emoji = '🏆'; msg = _t('quiz.perfect'); }
      else if (pct >= 70) { emoji = '🌟'; msg = _t('quiz.great'); }
      else if (pct >= 40) { emoji = '👍'; msg = _t('quiz.good'); }
      else { emoji = '🐾'; msg = _t('quiz.try_again'); }

      el.innerHTML = `<div class="quiz-results-screen">
        <div class="quiz-rating-emoji">${emoji}</div>
        <div class="quiz-score-big">${score}/${questions.length}</div>
        <div class="quiz-score-label">${_t('quiz.your_score')}</div>
        <div class="quiz-rating">${msg}</div>
        <div class="quiz-actions">
          <button class="quiz-play-again" id="quiz-again">${_t('quiz.play_again')}</button>
        </div>
        <div class="quiz-share-section">
          <div class="quiz-share-label">${_t('quiz.share')}</div>
          <div class="quiz-share-buttons">
            <button class="quiz-social-btn quiz-social-whatsapp" onclick="window.open('https://wa.me/?text=${encodeURIComponent('I scored ' + score + '/' + questions.length + ' on the Wildpedia Quiz! ' + window.location.href)}','_blank')">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.025.507 3.934 1.395 5.608L0 24l6.579-1.35A11.932 11.932 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75c-1.875 0-3.63-.51-5.13-1.395l-.36-.225-3.735.99.99-3.63-.24-.375A9.677 9.677 0 012.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75z"/></svg>
            </button>
            <button class="quiz-social-btn quiz-social-x" onclick="window.open('https://x.com/intent/tweet?text=${encodeURIComponent('I scored ' + score + '/' + questions.length + ' on the Wildpedia Quiz!')}&url=${encodeURIComponent(window.location.href)}','_blank')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </button>
            <button class="quiz-social-btn quiz-social-copy" onclick="_copyLink(this,'${window.location.href}')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
            </button>
          </div>
        </div>
      </div>`;

      document.getElementById('quiz-again').addEventListener('click', () => {
        state = 'start';
        render();
      });
    }
  }
  render();
}
