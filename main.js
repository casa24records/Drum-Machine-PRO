// index.js - Main module for soundkit repository
import manifest from './manifest.json' assert { type: 'json' };

/**
 * SoundkitManager - Main class for accessing soundkit data
 */
class SoundkitManager {
  constructor(manifestData = manifest, options = {}) {
    this.manifest = manifestData;
    this.baseUrl = options.baseUrl || manifestData.baseUrl || '';
    this.samplesPath = options.samplesPath || 'samples';
    
    // Create lookup maps for efficient access
    this.soundkitMap = new Map();
    this.soundkitsByInstrument = new Map();
    
    this._buildLookupMaps();
  }

  /**
   * Build internal lookup maps for efficient querying
   */
  _buildLookupMaps() {
    // Clear existing maps
    this.soundkitMap.clear();
    this.soundkitsByInstrument.clear();

    // Initialize instrument maps
    this.manifest.instruments.forEach(instrument => {
      this.soundkitsByInstrument.set(instrument, []);
    });

    // Populate maps
    this.manifest.soundkits.forEach(soundkit => {
      // Add to main map
      this.soundkitMap.set(soundkit.id, soundkit);
      
      // Add to instrument maps
      soundkit.availableInstruments.forEach(instrument => {
        this.soundkitsByInstrument.get(instrument).push(soundkit.id);
      });
    });
  }

  /**
   * Get all soundkits
   */
  getAllSoundkits() {
    return this.manifest.soundkits;
  }

  /**
   * Get soundkit by ID
   */
  getSoundkit(soundkitId) {
    return this.soundkitMap.get(soundkitId) || null;
  }

  /**
   * Get soundkit by name (case-insensitive)
   */
  getSoundkitByName(name) {
    const normalizedName = name.toLowerCase();
    return this.manifest.soundkits.find(
      kit => kit.name.toLowerCase() === normalizedName
    ) || null;
  }

  /**
   * Get all soundkits that have a specific instrument
   */
  getSoundkitsByInstrument(instrument) {
    const soundkitIds = this.soundkitsByInstrument.get(instrument) || [];
    return soundkitIds.map(id => this.soundkitMap.get(id));
  }

  /**
   * Get only complete soundkits (100% of instruments available)
   */
  getCompleteSoundkits() {
    return this.manifest.soundkits.filter(kit => kit.completeness === 100);
  }

  /**
   * Search soundkits by name (partial match)
   */
  searchSoundkits(query) {
    const normalizedQuery = query.toLowerCase();
    return this.manifest.soundkits.filter(kit => 
      kit.name.toLowerCase().includes(normalizedQuery)
    );
  }

  /**
   * Get the full URL for a sample file
   */
  getSampleUrl(soundkitId, instrument) {
    const soundkit = this.getSoundkit(soundkitId);
    if (!soundkit || !soundkit.instruments[instrument]) {
      return null;
    }

    const relativePath = soundkit.instruments[instrument];
    return this.baseUrl 
      ? `${this.baseUrl}/${this.samplesPath}/${relativePath}`
      : `${this.samplesPath}/${relativePath}`;
  }

  /**
   * Get all URLs for a soundkit
   */
  getSoundkitUrls(soundkitId) {
    const soundkit = this.getSoundkit(soundkitId);
    if (!soundkit) return null;

    const urls = {};
    Object.keys(soundkit.instruments).forEach(instrument => {
      urls[instrument] = this.getSampleUrl(soundkitId, instrument);
    });
    
    return urls;
  }

  /**
   * Load samples for Web Audio API
   * @param {AudioContext} audioContext - Web Audio API context
   * @param {string} soundkitId - ID of the soundkit to load
   * @returns {Promise<Object>} - Object with decoded audio buffers
   */
  async loadSoundkit(audioContext, soundkitId) {
    const urls = this.getSoundkitUrls(soundkitId);
    if (!urls) {
      throw new Error(`Soundkit "${soundkitId}" not found`);
    }

    const buffers = {};
    const loadPromises = [];

    for (const [instrument, url] of Object.entries(urls)) {
      const promise = fetch(url)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to load ${instrument}: ${response.statusText}`);
          }
          return response.arrayBuffer();
        })
        .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
        .then(audioBuffer => {
          buffers[instrument] = audioBuffer;
        })
        .catch(error => {
          console.error(`Error loading ${instrument}:`, error);
          buffers[instrument] = null;
        });
      
      loadPromises.push(promise);
    }

    await Promise.all(loadPromises);
    return buffers;
  }

  /**
   * Get statistics about the soundkit collection
   */
  getStatistics() {
    return this.manifest.statistics;
  }

  /**
   * Get metadata about the manifest
   */
  getMetadata() {
    return {
      version: this.manifest.version,
      generated: this.manifest.generated,
      totalSoundkits: this.manifest.totalSoundkits,
      instruments: this.manifest.instruments
    };
  }

  /**
   * Check if a soundkit has a specific instrument
   */
  hasInstrument(soundkitId, instrument) {
    const soundkit = this.getSoundkit(soundkitId);
    return soundkit ? soundkit.availableInstruments.includes(instrument) : false;
  }

  /**
   * Get soundkits sorted by completeness
   */
  getSoundkitsByCompleteness(ascending = false) {
    return [...this.manifest.soundkits].sort((a, b) => 
      ascending ? a.completeness - b.completeness : b.completeness - a.completeness
    );
  }
}

// Create default instance
const soundkitManager = new SoundkitManager();

// ES Module exports
export default soundkitManager;
export { SoundkitManager, manifest };

// CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = soundkitManager;
  module.exports.SoundkitManager = SoundkitManager;
  module.exports.manifest = manifest;
}
