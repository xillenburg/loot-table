// simulate.js
document.addEventListener('DOMContentLoaded', () => {
  const simulateBtn = document.getElementById('simulateBtn');
  const simulateModal = document.getElementById('simulateModal');
  const closeSimulate = document.getElementById('closeSimulate');
  const chestGrid = document.getElementById('chestGrid');
  const modalUpper = document.querySelector('#simulateModal .modal-upper');
  const modalLower = document.querySelector('#simulateModal .modal-lower');

  // Create item info display inside modal-upper (below chest grid)
  const itemInfoDisplay = document.createElement('div');
  itemInfoDisplay.id = 'itemInfoDisplay';
  itemInfoDisplay.className = 'item-info-display';
  modalUpper.appendChild(itemInfoDisplay);

  // ===== ALWAYS use the current edited data from script.js =====
  const getData = () => {
    // Use window._lt_data which gets updated when JSON is edited
    return window._lt_data || JSON.parse(localStorage.getItem('lootTableData') || 'null');
  };

  // ===== parseQuantity (standalone, mirrors script.js behavior) =====
  function parseQuantity(entry) {
    if (!entry) return 1;
    if (entry.count) {
      const q = parseCountObject(entry.count);
      if (q) return q;
    }
    if (Array.isArray(entry.functions)) {
      for (const func of entry.functions) {
        if (!func.count) continue;
        const q = parseCountObject(func.count);
        if (q) return q;
      }
    }
    return 1;
  }

  function parseCountObject(count) {
    if (typeof count === 'number') return count;
    if (typeof count === 'object') {
      // Handle all possible min/max formats dynamically
      const min = count.min ?? count.min_inclusive ?? count.min_exclusive ?? 1;
      const max = count.max ?? count.max_inclusive ?? count.max_exclusive ?? min;
      return min === max ? min : Math.floor(Math.random() * (max - min + 1)) + min;
    }
    return 1;
  }

  // ===== parse rolls for a pool (number or {min,max}) =====
  function parseRolls(rollsObj) {
    if (rollsObj === undefined || rollsObj === null) return 1;
    if (typeof rollsObj === 'number') return rollsObj;
    if (typeof rollsObj === 'object') {
      // Handle all possible min/max formats dynamically
      const min = rollsObj.min ?? rollsObj.min_inclusive ?? rollsObj.min_exclusive ?? 1;
      const max = rollsObj.max ?? rollsObj.max_inclusive ?? rollsObj.max_exclusive ?? min;
      return min === max ? min : Math.floor(Math.random() * (max - min + 1)) + min;
    }
    return 1;
  }

  // ===== build empty 27-slot chest grid =====
  function buildChestGrid() {
    chestGrid.innerHTML = '';
    for (let i = 0; i < 27; i++) {
      const slot = document.createElement('div');
      slot.className = 'chest-slot';
      slot.dataset.index = i;
      chestGrid.appendChild(slot);
    }
  }

  // ===== weighted random pick, supports zero/undefined weight handling =====
  function weightedRandom(items) {
    const totalWeight = items.reduce((sum, it) => sum + (Number(it.weight) || 0), 0);
    if (totalWeight <= 0) return null;
    let r = Math.random() * totalWeight;
    for (const it of items) {
      const w = Number(it.weight) || 0;
      if (r < w) return it;
      r -= w;
    }
    return null;
  }

  // ===== format item name with capital first letter =====
  function formatItemNameForDisplay(name) {
    if (!name) return "";
    let cleanName = name.replace("minecraft:", "");
    return cleanName
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  // ===== get item type (vanilla, modded, unknown) =====
  function getItemType(itemName) {
    const nameLower = itemName.toLowerCase();
    
    if (!itemName || nameLower.includes('air')) return 'Empty';
    
    if (typeof vanillaList !== 'undefined' && vanillaList.includes(nameLower)) {
      return 'Vanilla';
    } else if (typeof moddedList !== 'undefined' && moddedList.includes(nameLower)) {
      return 'Modded';
    } else {
      return 'Unknown';
    }
  }

  // ===== show item info when slot is clicked =====
  function showItemInfo(itemData) {
      if (!itemData) {
          itemInfoDisplay.innerHTML = '';
          return;
      }

      const displayName = formatItemNameForDisplay(itemData.name);
      const itemType = getItemType(itemData.name);
      
      itemInfoDisplay.innerHTML = `
        <div class="item-info">
          <div><strong>Item Name:</strong> ${displayName}</div>
          <div><strong>Item Type:</strong> ${itemType}</div>
          <div><strong>Quantity:</strong> ${itemData.qty}</div>
        </div>
      `;
  }

  // ===== simulate chest fill using rolls, weights, counts =====
  function simulateLoot() {
    // clear grid and info first
    buildChestGrid();
    itemInfoDisplay.innerHTML = '';

    const data = getData();
    if (!data || !Array.isArray(data.pools)) return;

    const slots = Array.from(chestGrid.children);

    // iterate pools in order, perform rolls for each pool
    for (const pool of data.pools) {
      if (!Array.isArray(pool.entries)) continue;

      // Determine rolls - handles all formats dynamically
      const rolls = parseRolls(pool.rolls);

      for (let r = 0; r < rolls; r++) {
        // build candidate list for this roll - use CURRENT data with updated weights
        const items = pool.entries.map(entry => {
          const name = entry.name || 'minecraft:air';
          const rawBase = name.replace(/^minecraft:/i, '');
          const qty = parseQuantity(entry);
          const weight = typeof entry.weight === 'number' ? entry.weight : 1;
          return { name, rawBase, qty, weight };
        });

        const chosen = weightedRandom(items);
        if (!chosen) continue;
        if (chosen.rawBase === 'air' || chosen.name.toLowerCase().includes('air')) {
          // rolled air, nothing to place
          continue;
        }

        // place into a random empty slot, if none available stop filling
        const emptySlots = slots.filter(s => s.children.length === 0);
        if (!emptySlots.length) return; // chest is full

        const target = emptySlots[Math.floor(Math.random() * emptySlots.length)];

        // create icon and qty label
        const img = document.createElement('img');
        img.src = window.getImagePath ? window.getImagePath(chosen.name) : `http://localhost:3000/images/${chosen.rawBase}.png`;
        img.alt = chosen.rawBase;
        img.onerror = () => { img.style.display = 'none'; };

        const qtySpan = document.createElement('span');
        qtySpan.className = 'slot-qty';
        qtySpan.textContent = chosen.qty;

        target.appendChild(img);
        target.appendChild(qtySpan);

        // Store item data for click events
        target.itemData = chosen;

        // Add click event to show item info
        target.addEventListener('click', () => {
          showItemInfo(chosen);
        });
      }
    }

    // Add click events to empty slots
    slots.forEach(slot => {
      if (!slot.itemData) {
        slot.addEventListener('click', () => {
          showItemInfo(null);
        });
      }
    });
  }

  // ===== modal open =====
  simulateBtn.addEventListener('click', () => {
    const data = getData();
    if (!data) {
      alert('Load a JSON file first');
      return;
    }
    simulateModal.style.display = 'block';
    buildChestGrid();
    itemInfoDisplay.innerHTML = '';
  });

  // ===== modal close =====
  closeSimulate.addEventListener('click', () => {
    simulateModal.style.display = 'none';
  });
  window.addEventListener('click', (e) => {
    if (e.target === simulateModal) simulateModal.style.display = 'none';
  });

  // ===== run simulation =====
  modalLower.addEventListener('click', (e) => {
    if (e.target.id === 'simulateGoBtn') {
      simulateLoot();
    }
  });
});