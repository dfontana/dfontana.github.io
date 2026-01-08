/**
 * Markov Chain Level Generator
 * Generates 2D tilemap levels using Markov chains trained on example maps.
 * Inspired by: https://rxi.github.io/level_generation_using_markov_chains.html
 */

class MarkovChain {
  constructor(order = 2) {
    this.order = order; // Number of previous characters to consider
    this.chain = new Map();
  }

  /**
   * Train the Markov chain on a sequence string
   */
  train(sequence) {
    if (sequence.length < this.order + 1) {
      throw new Error("Sequence is too short to train on the given order size");
    }

    for (let i = 0; i <= sequence.length - this.order - 1; i++) {
      const context = sequence.substring(i, i + this.order);
      const nextChar = sequence[i + this.order];

      if (!this.chain.has(context)) {
        this.chain.set(context, []);
      }
      this.chain.get(context).push(nextChar);
    }
  }

  /**
   * Generate a sequence of the specified length
   */
  generate(length, maxAttempts = 1000) {
    if (this.chain.size === 0) {
      throw new Error('Markov chain has not been trained');
    }

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Start with a random context from the chain
      const contexts = Array.from(this.chain.keys());
      let result = contexts[Math.floor(Math.random() * contexts.length)];

      // Generate characters until we reach the desired length
      while (result.length < length) {
        const context = result.substring(result.length - this.order);
        const options = this.chain.get(context);

        if (!options || options.length === 0) {
          // Dead end - try again with a new start
          break;
        }

        // Pick a random next character
        const nextChar = options[Math.floor(Math.random() * options.length)];
        result += nextChar;
      }

      if (result.length === length) {
        return result;
      }
    }

    // If we couldn't generate the exact length, return what we have or throw
    throw new Error(`Failed to generate sequence of length ${length}`);
  }
}

class LevelGenerator {
  constructor(config = {}) {
    this.width = config.width || 40;
    this.height = config.height || 30;
    this.tileTypes = config.tileTypes || {
      FLOOR: '0',
      WALL: '1',
      SPECIAL: '2'
    };
    this.order = config.order || 2; // Markov chain order
    this.trainingMaps = config.trainingMaps || this.getDefaultTrainingMaps();

    // Post-processing options
    this.enablePostProcessing = config.enablePostProcessing !== false; // default true
    this.cellularAutomataIterations = config.cellularAutomataIterations || 2;
    this.guaranteeConnectivity = config.guaranteeConnectivity !== false; // default true

    this.markovChain = new MarkovChain(this.order);

    // Train on example maps
    this.train();
  }

  /**
   * Default training maps - handcrafted example levels
   * Redesigned with 40-50% wall density and 2+ tile wide corridors for better traversability
   */
  getDefaultTrainingMaps() {
    return [
      // Map 1: Dungeon Rooms (45% walls) - Connected rooms with wide corridors
      [
        '11111111111111111111',
        '11000000111111000011',
        '11000000111111000011',
        '11000200111111002011',
        '11000000111111000011',
        '11000000000000000011',
        '11000000000000000011',
        '11111111000011111111',
        '11111111000011111111',
        '11000000000000000011',
        '11000000000000000011',
        '11000020000000000011',
        '11000000000000020011',
        '11000000000000000011',
        '11111111111111111111'
      ],
      // Map 2: Open Arena (40% walls) - Large open space with pillar obstacles
      [
        '11111111111111111111',
        '10000000000000000001',
        '10000000000000000001',
        '10000110000110000001',
        '10000110000110000001',
        '10000000000000000001',
        '10000000020000000001',
        '10000000000000000001',
        '10000000000000020001',
        '10000110000110000001',
        '10000110000110000001',
        '10000000000000000001',
        '10000000000000000001',
        '10000000000000000001',
        '11111111111111111111'
      ],
      // Map 3: Organic Cavern (50% walls) - Irregular open areas with wide passages
      [
        '11111111111111111111',
        '11000000000000000011',
        '10000000000000000001',
        '10000000001111000001',
        '10000000111111100001',
        '10000000111111100001',
        '10000000011111000001',
        '10000000000200000001',
        '10000000000000000001',
        '10000011111000000001',
        '10000111111100000001',
        '10000111111100020001',
        '10000011111000000001',
        '11000000000000000011',
        '11111111111111111111'
      ]
    ];
  }

  /**
   * Train the Markov chain on all training maps
   */
  train() {
    for (const map of this.trainingMaps) {
      for (const row of map) {
        this.markovChain.train(row);
      }
    }
  }

  /**
   * Generate a new level with optional post-processing
   */
  generate(options = {}) {
    // Allow per-call override of instance options
    const enablePostProcessing = options.enablePostProcessing !== undefined
      ? options.enablePostProcessing
      : this.enablePostProcessing;
    const cellularAutomataIterations = options.cellularAutomataIterations !== undefined
      ? options.cellularAutomataIterations
      : this.cellularAutomataIterations;
    const guaranteeConnectivity = options.guaranteeConnectivity !== undefined
      ? options.guaranteeConnectivity
      : this.guaranteeConnectivity;

    // Stage 1: Generate initial level using Markov chain
    const level = [];
    for (let y = 0; y < this.height; y++) {
      try {
        const row = this.markovChain.generate(this.width);
        level.push(row);
      } catch (error) {
        // Fallback: if generation fails, use a row from training data
        const randomMap = this.trainingMaps[Math.floor(Math.random() * this.trainingMaps.length)];
        const randomRow = randomMap[Math.floor(Math.random() * randomMap.length)];
        level.push(randomRow);
      }
    }

    // If post-processing disabled, return raw level
    if (!enablePostProcessing) {
      return level;
    }

    // Stage 2: Apply cellular automata smoothing
    let processedLevel = this.applyCellularAutomata(level, cellularAutomataIterations);

    // Stage 3: Ensure connectivity (tunnel carving if needed)
    if (guaranteeConnectivity) {
      processedLevel = this.ensureConnectivity(processedLevel);
    }

    return processedLevel;
  }

  /**
   * Count the number of neighbors of a specific tile type (8-directional)
   */
  countNeighbors(level, x, y, tileType) {
    const width = level[0].length;
    const height = level.length;
    let count = 0;

    // Check all 8 neighbors
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue; // Skip center

        const nx = x + dx;
        const ny = y + dy;

        // Treat out-of-bounds as walls (border enforcement)
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
          if (tileType === this.tileTypes.WALL) count++;
        } else {
          if (level[ny][nx] === tileType) count++;
        }
      }
    }

    return count;
  }

  /**
   * Apply cellular automata rules to smooth the level
   */
  applyCellularAutomata(level, iterations = 2) {
    const width = level[0].length;
    const height = level.length;

    for (let iter = 0; iter < iterations; iter++) {
      const newLevel = level.map(row => row.split(''));

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const wallNeighbors = this.countNeighbors(level, x, y, this.tileTypes.WALL);
          const currentTile = level[y][x];

          // Rule 1: Wall with 3 or fewer wall neighbors becomes floor
          // (Removes isolated wall protrusions)
          if (currentTile === this.tileTypes.WALL && wallNeighbors <= 3) {
            newLevel[y][x] = this.tileTypes.FLOOR;
          }
          // Rule 2: Floor with 5 or more wall neighbors becomes wall
          // (Fills isolated floor pockets)
          else if (currentTile === this.tileTypes.FLOOR && wallNeighbors >= 5) {
            newLevel[y][x] = this.tileTypes.WALL;
          }
          // Rule 3: Keep special tiles always as traversable
          else if (currentTile === this.tileTypes.SPECIAL) {
            newLevel[y][x] = this.tileTypes.SPECIAL;
          }
          // Otherwise keep current tile
          else {
            newLevel[y][x] = currentTile;
          }
        }
      }

      // Convert back to string array
      level = newLevel.map(row => row.join(''));
    }

    return level;
  }

  /**
   * Flood fill from a starting position to find all reachable tiles
   */
  floodFill(level, startX, startY) {
    const width = level[0].length;
    const height = level.length;
    const visited = new Set();
    const queue = [[startX, startY]];

    while (queue.length > 0) {
      const [x, y] = queue.shift();
      const key = `${x},${y}`;

      // Skip if already visited
      if (visited.has(key)) continue;

      // Skip if out of bounds
      if (x < 0 || x >= width || y < 0 || y >= height) continue;

      // Skip if wall
      const tile = level[y][x];
      if (tile === this.tileTypes.WALL) continue;

      // Mark as visited
      visited.add(key);

      // Add 4-directional neighbors (not diagonal for connectivity)
      queue.push([x + 1, y]);
      queue.push([x - 1, y]);
      queue.push([x, y + 1]);
      queue.push([x, y - 1]);
    }

    return visited; // Set of "x,y" strings
  }

  /**
   * Find all disconnected regions of floor tiles
   */
  findDisconnectedRegions(level) {
    const width = level[0].length;
    const height = level.length;
    const allFloors = [];
    const regions = [];

    // Collect all floor positions (including special tiles)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tile = level[y][x];
        if (tile === this.tileTypes.FLOOR || tile === this.tileTypes.SPECIAL) {
          allFloors.push([x, y]);
        }
      }
    }

    if (allFloors.length === 0) {
      return []; // No floors at all (degenerate case)
    }

    const globalVisited = new Set();

    // Find all disconnected regions
    for (const [x, y] of allFloors) {
      const key = `${x},${y}`;
      if (globalVisited.has(key)) continue;

      // Start a flood fill from this unvisited floor
      const region = this.floodFill(level, x, y);
      regions.push(region);

      // Add this region to global visited
      region.forEach(pos => globalVisited.add(pos));
    }

    return regions;
  }

  /**
   * Check if the level is fully connected
   */
  isFullyConnected(level) {
    const regions = this.findDisconnectedRegions(level);
    return regions.length <= 1; // 0 regions (no floors) or 1 region (all connected)
  }

  /**
   * Sample random positions from a region
   */
  sampleRegion(region, maxSamples) {
    const regionArray = Array.from(region);
    if (regionArray.length <= maxSamples) return regionArray;

    const sampled = [];
    const indices = new Set();

    while (sampled.length < maxSamples) {
      const idx = Math.floor(Math.random() * regionArray.length);
      if (!indices.has(idx)) {
        indices.add(idx);
        sampled.push(regionArray[idx]);
      }
    }

    return sampled;
  }

  /**
   * Carve a floor tile at the given position (preserve special tiles)
   */
  carveFloor(levelArray, x, y) {
    const width = levelArray[0].length;
    const height = levelArray.length;

    // Check bounds
    if (x < 0 || x >= width || y < 0 || y >= height) {
      return;
    }

    // Don't overwrite special tiles
    if (levelArray[y][x] !== this.tileTypes.SPECIAL) {
      levelArray[y][x] = this.tileTypes.FLOOR;
    }
  }

  /**
   * Carve a tunnel between two regions
   */
  carveTunnel(level, region1, region2) {
    // Find closest points between the two regions
    let minDist = Infinity;
    let bestPair = null;

    // Convert level to 2D array for easier modification
    const levelArray = level.map(row => row.split(''));

    // Sample points from each region (to avoid O(n²) comparison)
    const sample1 = this.sampleRegion(region1, 10);
    const sample2 = this.sampleRegion(region2, 10);

    for (const pos1 of sample1) {
      const [x1, y1] = pos1.split(',').map(Number);
      for (const pos2 of sample2) {
        const [x2, y2] = pos2.split(',').map(Number);
        const dist = Math.abs(x1 - x2) + Math.abs(y1 - y2); // Manhattan distance

        if (dist < minDist) {
          minDist = dist;
          bestPair = [[x1, y1], [x2, y2]];
        }
      }
    }

    if (!bestPair) return level; // Safety check

    // Carve a tunnel using L-shaped path
    const [[x1, y1], [x2, y2]] = bestPair;

    // Randomly choose which direction first for variety
    const horizontalFirst = Math.random() < 0.5;

    if (horizontalFirst) {
      // Horizontal segment
      const startX = Math.min(x1, x2);
      const endX = Math.max(x1, x2);
      for (let x = startX; x <= endX; x++) {
        // Carve 2-tile wide tunnel
        this.carveFloor(levelArray, x, y1);
        if (y1 + 1 < levelArray.length) this.carveFloor(levelArray, x, y1 + 1);
      }

      // Vertical segment
      const startY = Math.min(y1, y2);
      const endY = Math.max(y1, y2);
      for (let y = startY; y <= endY; y++) {
        this.carveFloor(levelArray, x2, y);
        if (x2 + 1 < levelArray[0].length) this.carveFloor(levelArray, x2 + 1, y);
      }
    } else {
      // Vertical then horizontal
      const startY = Math.min(y1, y2);
      const endY = Math.max(y1, y2);
      for (let y = startY; y <= endY; y++) {
        this.carveFloor(levelArray, x1, y);
        if (x1 + 1 < levelArray[0].length) this.carveFloor(levelArray, x1 + 1, y);
      }

      const startX = Math.min(x1, x2);
      const endX = Math.max(x1, x2);
      for (let x = startX; x <= endX; x++) {
        this.carveFloor(levelArray, x, y2);
        if (y2 + 1 < levelArray.length) this.carveFloor(levelArray, x, y2 + 1);
      }
    }

    // Convert back to string array
    return levelArray.map(row => row.join(''));
  }

  /**
   * Ensure the level is fully connected by carving tunnels between regions
   */
  ensureConnectivity(level, maxAttempts = 20) {
    let attempt = 0;

    while (attempt < maxAttempts) {
      const regions = this.findDisconnectedRegions(level);

      if (regions.length <= 1) {
        return level; // Fully connected!
      }

      // Connect largest region to next largest
      regions.sort((a, b) => b.size - a.size);

      // Connect region 0 (largest) to region 1 (second largest)
      level = this.carveTunnel(level, regions[0], regions[1]);

      attempt++;
    }

    // If still not connected after maxAttempts, log warning but return best effort
    if (typeof console !== 'undefined') {
      console.warn('Could not fully connect level after', maxAttempts, 'attempts');
    }
    return level;
  }
}
