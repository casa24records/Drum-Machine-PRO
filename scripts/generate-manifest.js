// scripts/generate-manifest.js
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  samplesDir: path.join(__dirname, '..', 'samples'),
  outputPath: path.join(__dirname, '..', 'manifest.json'),
  instruments: ['kick', 'snare', 'hihat', 'clap', 'crash', 'open', 'rim', 'bell'],
  fileExtension: '.wav',
  githubPagesBaseUrl: process.env.GITHUB_PAGES_URL || 'https://casa24records.github.io/Drum-Machine-PRO',
};

class SoundkitScanner {
  constructor(config = CONFIG) {
    this.config = config;
    this.soundkits = new Map();
  }

  /**
   * Parse filename to extract soundkit name and instrument type
   * @param {string} filename - e.g., "Batman Begins - kick.wav"
   * @returns {Object|null} - { soundkitName, instrument }
   */
  parseFilename(filename) {
    if (!filename.endsWith(this.config.fileExtension)) {
      return null;
    }

    // Remove extension and find last hyphen
    const nameWithoutExt = filename.slice(0, -this.config.fileExtension.length);
    const lastHyphenIndex = nameWithoutExt.lastIndexOf(' - ');
    
    if (lastHyphenIndex === -1) {
      console.warn(`Invalid filename format: ${filename}`);
      return null;
    }

    const soundkitName = nameWithoutExt.substring(0, lastHyphenIndex).trim();
    const instrument = nameWithoutExt.substring(lastHyphenIndex + 3).trim().toLowerCase();

    // Validate instrument
    if (!this.config.instruments.includes(instrument)) {
      console.warn(`Unknown instrument "${instrument}" in file: ${filename}`);
      return null;
    }

    return { soundkitName, instrument };
  }

  /**
   * Scan all instrument folders and build soundkit structure
   */
  async scan() {
    this.soundkits.clear();

    for (const instrument of this.config.instruments) {
      const instrumentPath = path.join(this.config.samplesDir, instrument);
      
      try {
        const files = await fs.readdir(instrumentPath);
        
        for (const filename of files) {
          // Skip non-wav files and hidden files
          if (!filename.endsWith(this.config.fileExtension) || filename.startsWith('.')) {
            continue;
          }

          const parsed = this.parseFilename(filename);
          if (!parsed) continue;

          const { soundkitName } = parsed;

          // Initialize soundkit if not exists
          if (!this.soundkits.has(soundkitName)) {
            this.soundkits.set(soundkitName, {
              name: soundkitName,
              id: this.generateId(soundkitName),
              instruments: {},
              completeness: 0,
              availableInstruments: []
            });
          }

          const soundkit = this.soundkits.get(soundkitName);
          
          // Add instrument file path (relative to samples directory)
          soundkit.instruments[instrument] = `${instrument}/${filename}`;
          soundkit.availableInstruments.push(instrument);
        }
      } catch (error) {
        if (error.code !== 'ENOENT') {
          console.error(`Error scanning ${instrument} folder:`, error);
        }
      }
    }

    // Calculate completeness for each soundkit
    this.soundkits.forEach(soundkit => {
      soundkit.availableInstruments = [...new Set(soundkit.availableInstruments)].sort();
      soundkit.completeness = (soundkit.availableInstruments.length / this.config.instruments.length) * 100;
    });

    return this.soundkits;
  }

  /**
   * Generate a URL-safe ID from soundkit name
   */
  generateId(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Generate manifest object
   */
  generateManifest() {
    const soundkitsArray = Array.from(this.soundkits.values())
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      version: '1.0.0',
      generated: new Date().toISOString(),
      totalSoundkits: soundkitsArray.length,
      instruments: this.config.instruments,
      baseUrl: this.config.githubPagesBaseUrl || null,
      soundkits: soundkitsArray,
      statistics: this.generateStatistics(soundkitsArray)
    };
  }

  /**
   * Generate statistics about the soundkit collection
   */
  generateStatistics(soundkits) {
    const stats = {
      totalFiles: 0,
      instrumentCoverage: {},
      completeSoundkits: 0,
      averageCompleteness: 0
    };

    // Initialize instrument coverage
    this.config.instruments.forEach(inst => {
      stats.instrumentCoverage[inst] = 0;
    });

    // Calculate statistics
    soundkits.forEach(kit => {
      kit.availableInstruments.forEach(inst => {
        stats.instrumentCoverage[inst]++;
        stats.totalFiles++;
      });
      
      if (kit.completeness === 100) {
        stats.completeSoundkits++;
      }
    });

    stats.averageCompleteness = soundkits.length > 0
      ? soundkits.reduce((sum, kit) => sum + kit.completeness, 0) / soundkits.length
      : 0;

    return stats;
  }

  /**
   * Save manifest to file
   */
  async saveManifest(manifest) {
    const json = JSON.stringify(manifest, null, 2);
    await fs.writeFile(this.config.outputPath, json, 'utf8');
    console.log(`✅ Manifest saved to ${this.config.outputPath}`);
    return manifest;
  }

  /**
   * Main execution method
   */
  async run() {
    console.log('🎵 Scanning soundkit samples...');
    
    await this.scan();
    
    if (this.soundkits.size === 0) {
      console.log('⚠️  No soundkits found. Add .wav files to the samples folders.');
      const emptyManifest = {
        version: '1.0.0',
        generated: new Date().toISOString(),
        totalSoundkits: 0,
        instruments: this.config.instruments,
        baseUrl: this.config.githubPagesBaseUrl || null,
        soundkits: [],
        statistics: this.generateStatistics([])
      };
      return await this.saveManifest(emptyManifest);
    }

    console.log(`📦 Found ${this.soundkits.size} soundkit(s)`);
    
    const manifest = this.generateManifest();
    await this.saveManifest(manifest);
    
    // Print summary
    console.log('\n📊 Summary:');
    console.log(`   Total soundkits: ${manifest.totalSoundkits}`);
    console.log(`   Complete soundkits: ${manifest.statistics.completeSoundkits}`);
    console.log(`   Average completeness: ${manifest.statistics.averageCompleteness.toFixed(1)}%`);
    console.log(`   Total files: ${manifest.statistics.totalFiles}`);
    
    return manifest;
  }
}

// Run if executed directly
if (process.argv[1] === __filename) {
  const scanner = new SoundkitScanner();
  scanner.run().catch(console.error);
}

export default SoundkitScanner;
export { CONFIG };

