# 🎵 Drum Machine PRO - Soundkit Library

A modular, auto-organizing soundkit library system for the Drum Machine PRO project. Features automatic detection, grouping, and manifest generation. Perfect for drum machines, samplers, and music production web applications.

## 📁 Repository Structure

```
Drum-Machine-PRO/
├── samples/              # All sound samples organized by instrument
│   ├── kick/            # Kick drum samples
│   ├── snare/           # Snare drum samples
│   ├── hihat/           # Hi-hat samples
│   ├── clap/            # Clap samples
│   ├── crash/           # Crash cymbal samples
│   ├── open/            # Open hi-hat samples
│   ├── rim/             # Rimshot samples
│   └── bell/            # Bell/ride samples
├── scripts/
│   └── generate-manifest.js  # Automatic soundkit detection script
├── demos/
│   └── index.html       # Interactive demo page
├── index.js             # Main module for importing
├── manifest.json        # Auto-generated soundkit manifest
└── package.json         # NPM configuration
```

## 🎯 How It Works

### File Naming Convention

Each `.wav` file must follow this pattern:
```
[soundkit name] - [instrument].wav
```

Examples:
- `Batman Begins - kick.wav`
- `TR-808 Classic - snare.wav`
- `Vintage Funk Kit - hihat.wav`

**Important Rules:**
- The soundkit name can contain spaces and capital letters
- The instrument type must be lowercase and match folder names
- The separator ` - ` (space-dash-space) is required
- Files are placed in their corresponding instrument folders

### Automatic Soundkit Detection

The system automatically:
1. Scans all instrument folders for `.wav` files
2. Parses filenames to extract soundkit names
3. Groups files by soundkit
4. Calculates completeness percentage
5. Generates a comprehensive manifest

## 🚀 Quick Start

### 1. Clone and Setup

```bash
git clone https://github.com/casa24records/Drum-Machine-PRO.git
cd Drum-Machine-PRO
npm install
```

### 2. Add Your Samples

Place your `.wav` files in the appropriate folders:
```bash
# Example: Adding the "Epic Drums" soundkit
cp "Epic Drums - kick.wav" samples/kick/
cp "Epic Drums - snare.wav" samples/snare/
cp "Epic Drums - hihat.wav" samples/hihat/
# ... and so on
```

### 3. Generate Manifest

```bash
npm run generate
```

This creates/updates `manifest.json` with all detected soundkits.

### 4. Test Locally

```bash
npm run demo
# Opens http://localhost:8080
```

## 💻 Using in Your Website

### Method 1: Direct Import (ES Modules)

```javascript
// Import from GitHub Pages or CDN
import soundkitManager from 'https://casa24records.github.io/Drum-Machine-PRO/index.js';

// Get all soundkits
const allKits = soundkitManager.getAllSoundkits();

// Get a specific soundkit
const kit = soundkitManager.getSoundkitByName('Batman Begins');

// Get sample URLs
const kickUrl = soundkitManager.getSampleUrl(kit.id, 'kick');

// Load for Web Audio API
const audioContext = new AudioContext();
const buffers = await soundkitManager.loadSoundkit(audioContext, kit.id);
```

### Method 2: Fetch Manifest Directly

```javascript
// Fetch the manifest
const response = await fetch('https://casa24records.github.io/Drum-Machine-PRO/manifest.json');
const manifest = await response.json();

// Access soundkits
manifest.soundkits.forEach(kit => {
    console.log(`${kit.name}: ${kit.completeness}% complete`);
    
    // Build sample URLs
    Object.entries(kit.instruments).forEach(([instrument, path]) => {
        const url = `https://casa24records.github.io/Drum-Machine-PRO/samples/${path}`;
        console.log(`  ${instrument}: ${url}`);
    });
});
```

### Method 3: NPM Package

```bash
npm install @casa24records/drum-machine-pro
```

```javascript
import soundkitManager from '@casa24records/drum-machine-pro';

// Use the same API as Method 1
const kits = soundkitManager.getAllSoundkits();
```

## 📊 Manifest Structure

The generated `manifest.json` contains:

```json
{
  "version": "1.0.0",
  "generated": "2024-01-15T10:30:00.000Z",
  "totalSoundkits": 5,
  "instruments": ["kick", "snare", "hihat", "clap", "crash", "open", "rim", "bell"],
  "baseUrl": "https://casa24records.github.io/Drum-Machine-PRO",
  "soundkits": [
    {
      "name": "Batman Begins",
      "id": "batman-begins",
      "instruments": {
        "kick": "kick/Batman Begins - kick.wav",
        "snare": "snare/Batman Begins - snare.wav"
        // ... other instruments
      },
      "completeness": 75,
      "availableInstruments": ["kick", "snare", "hihat", "clap", "crash", "open"]
    }
    // ... more soundkits
  ],
  "statistics": {
    "totalFiles": 40,
    "instrumentCoverage": {
      "kick": 5,
      "snare": 5,
      // ... coverage for each instrument
    },
    "completeSoundkits": 3,
    "averageCompleteness": 87.5
  }
}
```

## 🔧 API Reference

### Core Methods

#### `getAllSoundkits()`
Returns all available soundkits.

#### `getSoundkit(soundkitId)`
Get soundkit by ID.

#### `getSoundkitByName(name)`
Get soundkit by name (case-insensitive).

#### `searchSoundkits(query)`
Search soundkits by partial name match.

#### `getCompleteSoundkits()`
Get only 100% complete soundkits.

#### `getSoundkitsByInstrument(instrument)`
Get all soundkits containing a specific instrument.

#### `getSampleUrl(soundkitId, instrument)`
Get the full URL for a specific sample.

#### `loadSoundkit(audioContext, soundkitId)`
Load all samples for a soundkit as Web Audio buffers.

## 🎨 Web Audio API Example

```javascript
// Complete drum machine example
class DrumMachine {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.buffers = {};
    }

    async loadKit(soundkitId) {
        const manager = await import('https://casa24records.github.io/Drum-Machine-PRO/index.js');
        this.buffers = await manager.default.loadSoundkit(this.audioContext, soundkitId);
    }

    play(instrument) {
        if (!this.buffers[instrument]) return;
        
        const source = this.audioContext.createBufferSource();
        source.buffer = this.buffers[instrument];
        source.connect(this.audioContext.destination);
        source.start(0);
    }
}

// Usage
const drums = new DrumMachine();
await drums.loadKit('batman-begins');
drums.play('kick');
```

## 🚀 GitHub Actions Automation

The repository includes automatic manifest generation on push:

1. Detects changes to `.wav` files
2. Regenerates manifest
3. Commits changes
4. Deploys to GitHub Pages

Enable GitHub Pages in your repository settings:
- Source: Deploy from a branch
- Branch: `gh-pages` (created automatically)

## 📝 Scripts

- `npm run generate` - Generate manifest from current samples
- `npm run build` - Generate manifest and create CommonJS wrapper
- `npm run watch` - Auto-regenerate on file changes (dev mode)
- `npm run demo` - Start local server with demo page
- `npm test` - Run tests

## 🎯 Best Practices

1. **Consistent Naming**: Always use the exact same soundkit name across all instruments
2. **Quality Control**: Use high-quality, normalized samples
3. **File Size**: Optimize `.wav` files (44.1kHz, 16-bit is usually sufficient)
4. **Organization**: Keep related soundkits together (e.g., all TR-808 variations)
5. **Documentation**: Add notes about soundkit sources in commit messages

## 🔒 CORS Configuration

For GitHub Pages hosting, CORS is handled automatically. For custom hosting:

```nginx
# Nginx configuration
location /samples/ {
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods "GET, OPTIONS";
}
```

## 📦 Distribution

The library can be distributed via:
1. **GitHub Pages** (recommended) - Automatic with included workflow
2. **NPM** - Publish as a package
3. **CDN** - Use jsDelivr with GitHub: `https://cdn.jsdelivr.net/gh/casa24records/Drum-Machine-PRO@latest/`
4. **Self-hosted** - Deploy to your own server

## 🤝 Contributing

1. Fork the repository
2. Add your samples following the naming convention
3. Run `npm run generate` to test
4. Submit a pull request

## 📄 License

MIT License - See LICENSE file for details

## 🙋 Support

- Issues: [GitHub Issues](https://github.com/casa24records/Drum-Machine-PRO/issues)
- Discussions: [GitHub Discussions](https://github.com/casa24records/Drum-Machine-PRO/discussions)

---

Made with ❤️ for music producers and web developers by Casa24 Records
