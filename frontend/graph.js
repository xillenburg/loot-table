//graph.js
(() => {
  const graphCanvas = document.getElementById('graphCanvas');
  const modalLower = document.querySelector('.modal-lower');

  let chartInstance = null;

  const imageCache = {};
  function preloadImage(src) {
    return new Promise(resolve => {
      if (imageCache[src]) return resolve(imageCache[src]);
      const img = new Image();
      img.src = src;
      img.onload = () => { imageCache[src] = img; resolve(img); };
      img.onerror = () => { imageCache[src] = null; resolve(null); };
    });
  }

  // strip any namespace like "minecraft:" or "mod:" and normalize to lower case
  function stripNamespace(s) {
    return String(s || '').toLowerCase().replace(/^[^:]+:/, '');
  }

  async function renderGraph(data, currentFileName) {
    if (!data || !Array.isArray(data.pools)) {
      modalLower.textContent = "No loot pools found.";
      return;
    }

    const itemMap = {};
    let totalItemCount = 0;
    let minecraftItemCount = 0;
    let moddedItemCount = 0;

    data.pools.forEach(pool => {
      if (!Array.isArray(pool.entries)) return;
      pool.entries.forEach(entry => {
        const itemName = entry.name || "empty";
        const rawName = itemName.replace(/^minecraft:/i, '') || "empty";
        
        // Check for ID to differentiate duplicate items
        const itemId = entry.id || '';
        const uniqueName = itemId ? `${rawName} (${itemId})` : rawName;
        
        const weight = typeof entry.weight === 'number' ? entry.weight : 1;
        const imgPath = window.getImagePath ? window.getImagePath(itemName) : `http://localhost:3000/images/${rawName}.png`;

        if (!itemMap[uniqueName]) {
          itemMap[uniqueName] = { weight: 0, imgPath, rawName: rawName };
        }
        itemMap[uniqueName].weight += weight;
        
        // Count items (include everything)
        totalItemCount++;
        
        // Skip empty/air items for vanilla/modded counts
        if (rawName === 'empty' || itemName.toLowerCase().includes('air')) {
          return;
        }
        
        // Use loot_guides.js lists to determine if vanilla or modded
        const nameLower = itemName.toLowerCase();
        if (typeof vanillaList !== 'undefined' && vanillaList.includes(nameLower)) {
          minecraftItemCount++;
        } else if (typeof moddedList !== 'undefined' && moddedList.includes(nameLower)) {
          moddedItemCount++;
        }
        // Items not in either list are not counted as vanilla or modded
      });
    });

    const uniqueNames = Object.keys(itemMap);
    const weights = uniqueNames.map(name => itemMap[name].weight);
    const imgPaths = uniqueNames.map(name => itemMap[name].imgPath);
    const rawNames = uniqueNames.map(name => itemMap[name].rawName);

    if (!uniqueNames.length) {
      modalLower.textContent = "No loot entries found.";
      return;
    }

    const loadedImages = await Promise.all(imgPaths.map(p => preloadImage(p)));

    if (chartInstance) {
      try { chartInstance.destroy(); } catch (e) { }
      chartInstance = null;
    }

    const formattedNames = uniqueNames.map(uniqueName => {
      try { 
        // Extract base name without ID for formatting
        const baseName = uniqueName.includes(' (') ? uniqueName.split(' (')[0] : uniqueName;
        return typeof formatItemName === 'function' ? formatItemName(baseName) : uniqueName; 
      }
      catch { return uniqueName; }
    });

    // normalize the external lists into sets without namespaces so they match rawNames
    const vanillaSet = (typeof vanillaList !== 'undefined')
      ? new Set(vanillaList.map(stripNamespace))
      : new Set();
    const moddedSet = (typeof moddedList !== 'undefined')
      ? new Set(moddedList.map(stripNamespace))
      : new Set();

    const barColors = uniqueNames.map(uniqueName => {
      const baseName = uniqueName.includes(' (') ? uniqueName.split(' (')[0] : uniqueName;
      const norm = stripNamespace(baseName);
      if (vanillaSet.has(norm)) return 'rgba(0,200,0,0.9)'; // green
      if (moddedSet.has(norm)) return 'rgba(0,128,255,0.9)'; // blue
      if (baseName === 'empty' || norm.includes('air')) return 'rgba(255,0,0,0.9)'; // red
      return 'rgba(220,220,220,0.9)'; // fallback
    });

    chartInstance = new Chart(graphCanvas, {
      type: 'bar',
      data: {
        labels: uniqueNames,
        datasets: [{
          label: 'Weight',
          data: weights,
          backgroundColor: barColors
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { bottom: 70 } },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items) => {
                if (!items || !items.length) return '';
                const idx = items[0].dataIndex;
                return formattedNames[idx] || uniqueNames[idx] || '';
              },
              label: (item) => {
                return `Weight: ${item.parsed.y}`;
              }
            },
            titleFont: { size: 16, weight: '700' },
            bodyFont: { size: 13 }
          }
        },
        scales: {
          x: { ticks: { display: false } },
          y: { ticks: { color: '#ddd' }, beginAtZero: true }
        }
      },
      plugins: [{
        afterDatasetsDraw: (chart) => {
          const ctx = chart.ctx;
          const xScale = chart.scales.x;
          const iconSize = 28;
          const y = chart.chartArea.bottom + 12;
          uniqueNames.forEach((uniqueName, index) => {
            const img = loadedImages[index];
            if (!img) return;
            const x = xScale.getPixelForTick(index);
            ctx.drawImage(img, Math.round(x - iconSize / 2), Math.round(y), iconSize, iconSize);
          });
        }
      }]
    });

    modalLower.innerHTML = `
      <div>Loaded ${uniqueNames.length} unique items from ${currentFileName}</div>
      <div>Total Items: ${totalItemCount}</div>
      <div>Minecraft Items: ${minecraftItemCount}</div>
      <div>Modded Items: ${moddedItemCount}</div>
    `;
  }

  window.renderGraph = renderGraph;
})();