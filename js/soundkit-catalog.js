/**
 * Soundkit Catalog - Interactive JavaScript
 * Drum Machine PRO by Casa24 Records
 * 
 * Features:
 * - Auto-updates from manifest.json
 * - Search, sort, and filter functionality
 * - Audio preview with Web Audio API
 * - Mobile responsive
 * - Smooth animations
 */

// Import the soundkit manager
import soundkitManager from '../index.js';

// State management
const state = {
  allSoundkits: [],
  filteredSoundkits: [],
  currentSort: 'name-asc',
  currentFilter: 'all',
  searchQuery: '',
  audioContext: null,
  currentBuffers: {},
  isPlaying: {}
};

// DOM Elements
const elements = {
  updateDate: null,
  statsGrid: null,
  searchInput: null,
  sortSelect: null,
  filterSelect: null,
  soundkitGrid: null,
  visibleCount: null,
  totalCount: null,
  audioModal: null,
  modalTitle: null,
  modalClose: null,
  audioControls: null
};

// Initialize DOM elements
function initializeElements() {
  elements.updateDate = document.getElementById('update-date');
  elements.statsGrid = document.getElementById('stats-grid');
  elements.searchInput = document.getElementById('search-input');
  elements.sortSelect = document.getElementById('sort-select');
  elements.filterSelect = document.getElementById('filter-select');
  elements.soundkitGrid = document.getElementById('soundkit-grid');
  elements.visibleCount = document.getElementById('visible-count');
  elements.totalCount = document.getElementById('total-count');
  elements.audioModal = document.getElementById('audio-modal');
  elements.modalTitle = document.getElementById('modal-title');
  elements.modalClose = document.getElementById('modal-close');
  elements.audioControls = document.getElementById('audio-controls');
}

// Format date for display
function formatDate(dateString) {
  if (!dateString) return 'Unknown';
  
  const date = new Date(dateString);
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return date.toLocaleDateString('en-US', options);
}

// Initialize Audio Context
function initAudioContext() {
  if (!state.audioContext) {
    state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  
  // Resume context if it's suspended (browser policy)
  if (state.audioContext.state === 'suspended') {
    state.audioContext.resume();
  }
  
  return state.audioContext;
}

// Render statistics
function renderStatistics() {
  const stats = soundkitManager.getStatistics();
  const metadata = soundkitManager.getMetadata();
  
  elements.statsGrid.innerHTML = `
    <div class="stat-card">
      <div class="stat-value">${metadata.totalSoundkits}</div>
      <div class="stat-label">Total Soundkits</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.completeSoundkits}</div>
      <div class="stat-label">Complete Kits</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.totalFiles}</div>
      <div class="stat-label">Total Samples</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${Math.round(stats.averageCompleteness)}%</div>
      <div class="stat-label">Avg Completeness</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${metadata.instruments.length}</div>
      <div class="stat-label">Instrument Types</div>
    </div>
  `;
}

// Create soundkit card HTML
function createSoundkitCard(soundkit) {
  const completenessClass = soundkit.completeness === 100 ? 'complete' : 'incomplete';
  const metadata = soundkitManager.getMetadata();
  
  return `
    <div class="soundkit-card" data-soundkit-id="${soundkit.id}">
      <div class="soundkit-header">
        <h3 class="soundkit-name">${soundkit.name}</h3>
        <div class="soundkit-completeness">
          <span class="completeness-badge ${completenessClass}">
            ${Math.round(soundkit.completeness)}%
          </span>
        </div>
      </div>
      
      <div class="soundkit-instruments">
        ${metadata.instruments.map(instrument => {
          const isAvailable = soundkit.availableInstruments.includes(instrument);
          const className = isAvailable ? 'available' : 'unavailable';
          const dataAttr = isAvailable ? `data-instrument="${instrument}"` : '';
          
          return `
            <button 
              class="instrument-btn ${className}" 
              ${dataAttr}
              ${!isAvailable ? 'disabled' : ''}
              title="${isAvailable ? `Play ${instrument}` : `${instrument} not available`}"
            >
              ${instrument}
            </button>
          `;
        }).join('')}
      </div>
      
      <div class="soundkit-actions">
        <button class="soundkit-btn preview-btn" data-action="preview">
          Preview All
        </button>
        <button class="soundkit-btn download-btn" data-action="download">
          Download
        </button>
      </div>
    </div>
  `;
}

// Render soundkit grid
function renderSoundkits() {
  const kits = state.filteredSoundkits;
  
  // Update counts
  elements.visibleCount.textContent = kits.length;
  elements.totalCount.textContent = state.allSoundkits.length;
  
  if (kits.length === 0) {
    elements.soundkitGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🎵</div>
        <h3 class="empty-state-title">No soundkits found</h3>
        <p class="empty-state-text">
          Try adjusting your search or filter settings
        </p>
      </div>
    `;
    return;
  }
  
  // Render soundkit cards
  elements.soundkitGrid.innerHTML = kits.map(createSoundkitCard).join('');
  
  // Add event listeners to cards
  attachCardEventListeners();
}

// Attach event listeners to soundkit cards
function attachCardEventListeners() {
  // Instrument buttons
  document.querySelectorAll('.instrument-btn.available').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const soundkitCard = e.target.closest('.soundkit-card');
      const soundkitId = soundkitCard.dataset.soundkitId;
      const instrument = e.target.dataset.instrument;
      
      await playInstrument(soundkitId, instrument, e.target);
    });
  });
  
  // Preview all button
  document.querySelectorAll('.preview-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const soundkitCard = e.target.closest('.soundkit-card');
      const soundkitId = soundkitCard.dataset.soundkitId;
      
      await previewSoundkit(soundkitId);
    });
  });
  
  // Download button
  document.querySelectorAll('.download-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const soundkitCard = e.target.closest('.soundkit-card');
      const soundkitId = soundkitCard.dataset.soundkitId;
      
      showDownloadModal(soundkitId);
    });
  });
}

// Play a single instrument sample
async function playInstrument(soundkitId, instrument, buttonElement) {
  const context = initAudioContext();
  
  // Visual feedback
  buttonElement.classList.add('playing');
  
  try {
    // Check if we already have this buffer
    const bufferKey = `${soundkitId}_${instrument}`;
    
    if (!state.currentBuffers[bufferKey]) {
      // Load the sample
      const sampleUrl = soundkitManager.getSampleUrl(soundkitId, instrument);
      if (!sampleUrl) {
        console.error(`Sample not found: ${soundkitId} - ${instrument}`);
        return;
      }
      
      const response = await fetch(sampleUrl);
      const arrayBuffer = await response.arrayBuffer();
      state.currentBuffers[bufferKey] = await context.decodeAudioData(arrayBuffer);
    }
    
    // Create and play buffer source
    const source = context.createBufferSource();
    source.buffer = state.currentBuffers[bufferKey];
    
    // Add some effects for better sound
    const gainNode = context.createGain();
    gainNode.gain.value = 0.8;
    
    source.connect(gainNode);
    gainNode.connect(context.destination);
    
    source.onended = () => {
      buttonElement.classList.remove('playing');
      delete state.isPlaying[bufferKey];
    };
    
    source.start(0);
    state.isPlaying[bufferKey] = source;
    
  } catch (error) {
    console.error(`Error playing sample: ${error.message}`);
    buttonElement.classList.remove('playing');
  }
}

// Preview all instruments in a soundkit
async function previewSoundkit(soundkitId) {
  const soundkit = soundkitManager.getSoundkit(soundkitId);
  if (!soundkit) return;
  
  const context = initAudioContext();
  const availableInstruments = soundkit.availableInstruments;
  
  // Play each instrument with a slight delay
  for (let i = 0; i < availableInstruments.length; i++) {
    const instrument = availableInstruments[i];
    const btn = document.querySelector(
      `.soundkit-card[data-soundkit-id="${soundkitId}"] .instrument-btn[data-instrument="${instrument}"]`
    );
    
    if (btn) {
      await playInstrument(soundkitId, instrument, btn);
      // Wait 300ms between samples
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
}

// Show download modal
function showDownloadModal(soundkitId) {
  const soundkit = soundkitManager.getSoundkit(soundkitId);
  if (!soundkit) return;
  
  elements.modalTitle.textContent = `Download ${soundkit.name}`;
  
  elements.audioControls.innerHTML = `
    <div style="text-align: center; padding: 2rem;">
      <p style="margin-bottom: 2rem; color: var(--color-text-muted);">
        Download individual samples for <strong style="color: var(--color-accent)">${soundkit.name}</strong>
      </p>
      <div class="audio-controls">
        ${soundkit.availableInstruments.map(instrument => {
          const sampleUrl = soundkitManager.getSampleUrl(soundkitId, instrument);
          return `
            <a 
              href="${sampleUrl}" 
              download="${soundkit.name} - ${instrument}.wav"
              class="audio-btn"
              target="_blank"
              rel="noopener noreferrer"
            >
              ${instrument}
            </a>
          `;
        }).join('')}
      </div>
      <div style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid var(--color-border);">
        <p style="font-size: 0.875rem; color: var(--color-text-muted);">
          Tip: Use the soundkit manager API to load all samples at once in your projects
        </p>
        <div class="code-snippet" style="margin-top: 1rem; text-align: left;">
          <code>
            const buffers = await soundkitManager.loadSoundkit(audioContext, '${soundkitId}');
          </code>
        </div>
      </div>
    </div>
  `;
  
  elements.audioModal.style.display = 'flex';
  
  // Close modal handlers
  const closeModal = () => {
    elements.audioModal.style.display = 'none';
  };
  
  elements.modalClose.onclick = closeModal;
  elements.audioModal.querySelector('.modal-overlay').onclick = closeModal;
  
  // ESC key to close
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
}

// Sort soundkits
function sortSoundkits(sortBy) {
  const sorted = [...state.filteredSoundkits];
  
  switch (sortBy) {
    case 'name-asc':
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'name-desc':
      sorted.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case 'completeness-desc':
      sorted.sort((a, b) => b.completeness - a.completeness);
      break;
    case 'completeness-asc':
      sorted.sort((a, b) => a.completeness - b.completeness);
      break;
  }
  
  state.filteredSoundkits = sorted;
  renderSoundkits();
}

// Filter soundkits
function filterSoundkits() {
  let filtered = [...state.allSoundkits];
  
  // Apply search filter
  if (state.searchQuery) {
    const query = state.searchQuery.toLowerCase();
    filtered = filtered.filter(kit => 
      kit.name.toLowerCase().includes(query) ||
      kit.availableInstruments.some(inst => inst.includes(query))
    );
  }
  
  // Apply completeness filter
  switch (state.currentFilter) {
    case 'complete':
      filtered = filtered.filter(kit => kit.completeness === 100);
      break;
    case 'incomplete':
      filtered = filtered.filter(kit => kit.completeness < 100);
      break;
  }
  
  state.filteredSoundkits = filtered;
  sortSoundkits(state.currentSort);
}

// Setup event listeners
function setupEventListeners() {
  // Search input
  elements.searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    filterSoundkits();
  });
  
  // Sort select
  elements.sortSelect.addEventListener('change', (e) => {
    state.currentSort = e.target.value;
    sortSoundkits(state.currentSort);
  });
  
  // Filter select
  elements.filterSelect.addEventListener('change', (e) => {
    state.currentFilter = e.target.value;
    filterSoundkits();
  });
  
  // Modal close button
  elements.modalClose.addEventListener('click', () => {
    elements.audioModal.style.display = 'none';
  });
  
  // Click outside modal to close
  elements.audioModal.querySelector('.modal-overlay').addEventListener('click', () => {
    elements.audioModal.style.display = 'none';
  });
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Focus search on '/' key
    if (e.key === '/' && document.activeElement !== elements.searchInput) {
      e.preventDefault();
      elements.searchInput.focus();
    }
    
    // Clear search on ESC
    if (e.key === 'Escape' && document.activeElement === elements.searchInput) {
      elements.searchInput.value = '';
      state.searchQuery = '';
      filterSoundkits();
      elements.searchInput.blur();
    }
  });
}

// Initialize the catalog
async function initializeCatalog() {
  try {
    // Initialize DOM elements
    initializeElements();
    
    // Show loading state
    elements.soundkitGrid.innerHTML = `
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p class="loading-text">Loading soundkits...</p>
      </div>
    `;
    
    // Load manifest data (soundkitManager already has it)
    const metadata = soundkitManager.getMetadata();
    const allSoundkits = soundkitManager.getAllSoundkits();
    
    // Update state
    state.allSoundkits = allSoundkits;
    state.filteredSoundkits = allSoundkits;
    
    // Update UI
    elements.updateDate.textContent = formatDate(metadata.generated);
    
    // Render statistics
    renderStatistics();
    
    // Initial render
    sortSoundkits(state.currentSort);
    
    // Setup event listeners
    setupEventListeners();
    
    // Log success
    console.log(`✅ Catalog initialized with ${allSoundkits.length} soundkits`);
    
  } catch (error) {
    console.error('Error initializing catalog:', error);
    
    elements.soundkitGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <h3 class="empty-state-title">Error loading soundkits</h3>
        <p class="empty-state-text">
          ${error.message}
        </p>
      </div>
    `;
  }
}

// Auto-refresh functionality (check for updates every 5 minutes)
function setupAutoRefresh() {
  setInterval(async () => {
    try {
      // Fetch fresh manifest
      const response = await fetch('./manifest.json?t=' + Date.now());
      const newManifest = await response.json();
      
      // Check if data has changed
      const currentGenerated = soundkitManager.getMetadata().generated;
      if (newManifest.generated !== currentGenerated) {
        console.log('📦 New manifest detected, refreshing catalog...');
        
        // Reload the page to get fresh data
        window.location.reload();
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  }, 5 * 60 * 1000); // 5 minutes
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeCatalog();
    setupAutoRefresh();
  });
} else {
  initializeCatalog();
  setupAutoRefresh();
}

// Export for debugging
window.catalogState = state;
window.catalogManager = {
  refresh: initializeCatalog,
  playInstrument,
  previewSoundkit
};
