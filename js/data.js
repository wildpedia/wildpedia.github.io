/**
 * data.js - Data loader and cache for AnimalKingdom
 * Fetches and caches all animal data JSON files
 */
const Data = (() => {
  let _animals = null;
  let _categories = null;
  let _habitats = null;
  let _senses = null;
  let _records = null;
  let _conservation = null;
  let _humanRelations = null;
  let _ecosystemRoles = null;

  async function _load(url) {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Failed to load ${url}: ${resp.status}`);
    return resp.json();
  }

  async function _loadSafe(url) {
    try { return await _load(url); } catch(e) { console.warn('Optional data not loaded:', url); return null; }
  }

  async function init() {
    if (!_animals || !_categories) {
      const [animals, categories, habitats, senses, records, conservation, humanRelations, ecosystemRoles] = await Promise.all([
        _load('data/animals.json'),
        _load('data/categories.json'),
        _loadSafe('data/habitats.json'),
        _loadSafe('data/senses.json'),
        _loadSafe('data/records.json'),
        _loadSafe('data/conservation.json'),
        _loadSafe('data/human-relations.json'),
        _loadSafe('data/ecosystem-roles.json')
      ]);
      _animals = animals;
      _categories = categories;
      _habitats = habitats;
      _senses = senses;
      _records = records;
      _conservation = conservation;
      _humanRelations = humanRelations;
      _ecosystemRoles = ecosystemRoles;
    }
  }

  // Animals
  function getAllAnimals() { return _animals || []; }
  function getAnimal(id) { return (_animals || []).find(a => a.id === id) || null; }
  function getAnimalsByClass(cls) { return (_animals || []).filter(a => a.class === cls); }
  function getAnimalsByHabitat(hab) { return (_animals || []).filter(a => a.habitat && a.habitat.includes(hab)); }
  function getAnimalsByContinent(cont) { return (_animals || []).filter(a => a.continent && a.continent.includes(cont)); }
  function getAnimalsByDiet(diet) { return (_animals || []).filter(a => a.diet === diet); }
  function getAnimalsByTag(tag) { return (_animals || []).filter(a => a.tags && a.tags.includes(tag)); }
  function getAnimalsByEcosystemRole(role) { return (_animals || []).filter(a => a.ecosystem_role === role); }
  function getAnimalsByConservationStatus(status) { return (_animals || []).filter(a => a.conservation_status === status); }
  function getAnimalsByHumanRelationType(type) { return (_animals || []).filter(a => a.human_relation && a.human_relation.type === type); }
  function getAnimalsByDangerLevel(min, max) {
    return (_animals || []).filter(a => {
      const d = a.human_relation && a.human_relation.danger_level;
      return d >= min && d <= max;
    });
  }
  function getAnimalsBySpecialSense(sense) {
    return (_animals || []).filter(a => a.senses && a.senses.special && a.senses.special.includes(sense));
  }
  function getRelatedAnimals(animalId) {
    const animal = getAnimal(animalId);
    if (!animal || !animal.related_animals) return [];
    return animal.related_animals.map(id => getAnimal(id)).filter(Boolean);
  }

  // Categories
  function getCategories() { return _categories || []; }
  function getCategory(id) { return (_categories || []).find(c => c.id === id) || null; }

  // Habitats
  function getHabitats() { return _habitats || []; }
  function getHabitat(id) { return (_habitats || []).find(h => h.id === id) || null; }

  // Senses
  function getSenses() { return _senses || []; }
  function getSense(id) { return (_senses || []).find(s => s.id === id) || null; }

  // Records
  function getRecords() { return _records || []; }
  function getRecord(id) { return (_records || []).find(r => r.id === id) || null; }
  function getRecordsByCategory(cat) { return (_records || []).filter(r => r.category === cat); }

  // Conservation
  function getConservation() { return _conservation || {}; }
  function getConservationStatuses() { return (_conservation && _conservation.statuses) || []; }
  function getConservationStatus(id) { return ((_conservation && _conservation.statuses) || []).find(s => s.id === id) || null; }
  function getConservationThreats() { return (_conservation && _conservation.threats) || []; }
  function getConservationSuccessStories() { return (_conservation && _conservation.success_stories) || []; }

  // Human Relations
  function getHumanRelations() { return _humanRelations || []; }
  function getHumanRelation(id) { return (_humanRelations || []).find(r => r.id === id) || null; }

  // Ecosystem Roles
  function getEcosystemRoles() { return _ecosystemRoles || []; }
  function getEcosystemRole(id) { return (_ecosystemRoles || []).find(r => r.id === id) || null; }

  // Scoring helpers
  function getStatScore(animal, statKey) {
    if (!animal || !animal.stats) return 0;
    return animal.stats[statKey] || 0;
  }

  function getSenseScore(animal, senseKey) {
    if (!animal || !animal.senses) return 0;
    return animal.senses[senseKey] || 0;
  }

  function getOverallSenseScore(animal) {
    if (!animal || !animal.senses) return 0;
    const keys = ['vision', 'hearing', 'smell', 'taste', 'touch'];
    let total = 0;
    keys.forEach(k => { total += animal.senses[k] || 0; });
    const specialBonus = (animal.senses.special && animal.senses.special.length) || 0;
    return Math.round(((total / (keys.length * 5)) * 100) + (specialBonus * 10));
  }

  function getDangerLabel(level) {
    const labels = { 1: 'harmless', 2: 'low', 3: 'moderate', 4: 'dangerous', 5: 'extreme' };
    return labels[level] || 'unknown';
  }

  function getDangerColor(level) {
    const colors = { 1: '#4CAF50', 2: '#8BC34A', 3: '#FFC107', 4: '#FF5722', 5: '#D32F2F' };
    return colors[level] || '#999';
  }

  function getIUCNColor(status) {
    const colors = { LC: '#006400', NT: '#8B8000', VU: '#CC6600', EN: '#CC0000', CR: '#8B0000', EW: '#4B0082', EX: '#000000' };
    return colors[status] || '#999';
  }

  // Top animals by stat
  function getTopBySpeed(limit) {
    return getAllAnimals().filter(a => a.stats && a.stats.speed_kmh > 0)
      .sort((a, b) => b.stats.speed_kmh - a.stats.speed_kmh).slice(0, limit || 10);
  }

  function getTopByWeight(limit) {
    return getAllAnimals().filter(a => a.stats && a.stats.weight_kg > 0)
      .sort((a, b) => b.stats.weight_kg - a.stats.weight_kg).slice(0, limit || 10);
  }

  function getTopByLifespan(limit) {
    return getAllAnimals().filter(a => a.stats && a.stats.lifespan_years > 0)
      .sort((a, b) => b.stats.lifespan_years - a.stats.lifespan_years).slice(0, limit || 10);
  }

  return {
    init,
    getAllAnimals, getAnimal, getAnimalsByClass, getAnimalsByHabitat, getAnimalsByContinent,
    getAnimalsByDiet, getAnimalsByTag, getAnimalsByEcosystemRole,
    getAnimalsByConservationStatus, getAnimalsByHumanRelationType, getAnimalsByDangerLevel,
    getAnimalsBySpecialSense, getRelatedAnimals,
    getCategories, getCategory,
    getHabitats, getHabitat,
    getSenses, getSense,
    getRecords, getRecord, getRecordsByCategory,
    getConservation, getConservationStatuses, getConservationStatus,
    getConservationThreats, getConservationSuccessStories,
    getHumanRelations, getHumanRelation,
    getEcosystemRoles, getEcosystemRole,
    getStatScore, getSenseScore, getOverallSenseScore,
    getDangerLabel, getDangerColor, getIUCNColor,
    getTopBySpeed, getTopByWeight, getTopByLifespan
  };
})();
