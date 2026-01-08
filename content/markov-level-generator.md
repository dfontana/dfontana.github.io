+++
title = "2D Level Generation"
date = 2026-01-07
[taxonomies]
tags = ["interactive", "procedural-generation", "markov-chains", "cellular-automata"]
[extra]
show_comments = false
+++

An interactive procedural level generator using Markov chains. The algorithm learns patterns from handcrafted example maps and generates new levels that feel similar but unique. Inspired by [rxi's blog post](https://rxi.github.io/level_generation_using_markov_chains.html).
<!-- more -->


## The Level

<div id="level-container">
  <div id="level-display"></div>
</div>

<div id="controls">
  <button id="regenerate-btn">Regenerate Level</button>
</div>

- **\*** denote "special" tiles (collectables, etc)

<script src="/markov-level-generator.js"></script>

<script>
  const TILE_CHARS = {
    '0': ' ',  // Floor
    '1': '#',  // Wall
    '2': '*'   // Special
  };

  let generator;
  let currentLevel;

  function initGenerator() {
    generator = new LevelGenerator({
      width: 40,
      height: 30,
      order: 2
    });
    renderLevel();
  }

  function renderLevel() {
    const level = generator.generate();
    currentLevel = level;

    const display = document.getElementById('level-display');

    // Clear previous content
    display.innerHTML = '';

    // Create a pre element for monospaced rendering
    const pre = document.createElement('pre');
    pre.className = 'tilemap';

    // Convert each row to rendered characters
    const renderedRows = level.map(row => {
      return row.split('').map(tile => TILE_CHARS[tile] || tile).join('');
    });

    pre.textContent = renderedRows.join('\n');
    display.appendChild(pre);
  }

  function handleRegenerate() {
    renderLevel();
  }

  // Initialize on page load
  document.addEventListener('DOMContentLoaded', () => {
    initGenerator();
    document.getElementById('regenerate-btn').addEventListener('click', handleRegenerate);
  });
</script>

## How It Works

A **3-stage pipeline** creates fully traversable levels

### Stage 1: Markov Chain Generation
The algorithm analyzes handcrafted training maps and learns tile placement patterns
- Slides 2 tiles at a time to determine the next one
- Each row starts with a random context from training data and probabilistically selects next tiles
- This creates an initial level similar to the training maps

### Stage 2: Cellular Automata Smoothing
Next 2 iterations of cellular automata rules to reduce noise in the levels
- Removes isolated wall protrusions (walls with <=3 wall neighbors become floors)
- Fills isolated floor pockets (floors with >=5 wall neighbors become walls)

### Stage 3: Connectivity Validation & Tunnel Carving
To prevent "holes" that can't be reached
- Uses flood-fill to detect disconnected floor regions
- Automatically carves 2-tile wide tunnels between isolated areas

### Training Data

Three training maps try to convey general ideas. They all keep at least 2 wide corridors to simulate traversable space.
- **Dungeon Rooms** (45% walls) - Connected rooms with wide corridors
- **Open Arena** (40% walls) - Large open space with pillar obstacles
- **Organic Cavern** (50% walls) - Irregular areas with wide passages
