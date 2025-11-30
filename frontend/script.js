//script.js
document.addEventListener('DOMContentLoaded', () => {
  const mainScreen = document.getElementById('main-screen');
  const jsonOutput = document.getElementById('jsonOutput');
  const lineNumbersDiv = document.getElementById('lineNumbers');
  const lootTable = document.getElementById('lootTable');
  const jsonContainer = document.querySelector('.json-container');
  const fileBar = document.getElementById('fileBar');
  const backBtn = document.getElementById('backBtn');

  const graphBtn = document.getElementById('graphBtn');
  const simulateBtn = document.getElementById('simulateBtn');
  const modal = document.getElementById('graphModal');
  const closeBtn = modal.querySelector('.close');

  let data = null;
  let itemLineMap = {};
  let currentFileName = '';

  window._lt_data = null;
  window._lt_debug = {
    handleFile: null,
    buildLootTable: null,
    getData: () => data,
    currentFileName: () => currentFileName
  };

  function updateGlobalData() {
    window._lt_data = data;
    window._lt_debug.getData = () => data;
    window._lt_debug.currentFileName = () => currentFileName;
  }

  function updateLineNumbers() {
    const cs = window.getComputedStyle(jsonOutput);
    lineNumbersDiv.style.lineHeight = cs.lineHeight;
    lineNumbersDiv.style.fontFamily = cs.fontFamily;
    lineNumbersDiv.style.fontSize = cs.fontSize;
    lineNumbersDiv.style.paddingTop = cs.paddingTop;
    lineNumbersDiv.style.paddingBottom = cs.paddingBottom;

    const lines = jsonOutput.textContent.split("\n").length;
    lineNumbersDiv.innerHTML = "";
    for (let i = 1; i <= lines; i++) {
      const div = document.createElement("div");
      div.textContent = i;
      lineNumbersDiv.appendChild(div);
    }
  }

  jsonContainer.addEventListener('scroll', () => {
    lineNumbersDiv.scrollTop = jsonContainer.scrollTop;
  });

  function highlightLine(lineNum) {
    const pre = jsonOutput;
    const text = pre.textContent.split("\n");
    if (lineNum < 1 || lineNum > text.length) return;

    const escaped = text.map((ln, idx) => {
      const esc = ln
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      if (idx === lineNum - 1) return `<span class="json-line-highlight">${esc}</span>`;
      return esc;
    }).join("\n");

    pre.innerHTML = escaped;
    setTimeout(() => {
      pre.textContent = JSON.stringify(data, null, 2);
      updateLineNumbers();
    }, 800);
  }

  function scrollLineToCenter(lineNum) {
    const lineHeight = parseFloat(window.getComputedStyle(jsonOutput).lineHeight) || 18;
    const containerHeight = jsonContainer.clientHeight;
    jsonContainer.scrollTop = (lineNum - 1) * lineHeight - (containerHeight / 2) + (lineHeight / 2);
  }

  function scrollAndHighlight(lineNum) {
    scrollLineToCenter(lineNum);
    highlightLine(lineNum);
  }

  function parseQuantity(entry) {
    if (!entry) return "1";
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
    return "1";
  }

  function parseCountObject(count) {
    if (typeof count === "number") return String(count);
    if (typeof count === "object") {
      if (count.type === "minecraft:constant" && count.value !== undefined) return String(count.value);
      if (count.type === "minecraft:uniform") {
        const min = count.min ?? 1;
        const max = count.max ?? min;
        return min === max ? `${min}` : `${min}-${max}`;
      }
      if (count.min !== undefined || count.max !== undefined) {
        const min = count.min ?? 1;
        const max = count.max ?? min;
        return min === max ? `${min}` : `${min}-${max}`;
      }
    }
    return null;
  }

function findItemLine(entry, jsonLines) {
    const itemName = entry.name;
    const itemId = entry.id;
    
    // If item has an ID, look for the exact line with that ID
    if (itemId) {
        const idSearchString = `"id": "${itemId}"`;
        
        // Find the line with the exact ID
        for (let i = 0; i < jsonLines.length; i++) {
            if (jsonLines[i].includes(idSearchString)) {
                return i + 1; // Return the line where the ID is found
            }
        }
    }
    
    // Fallback: find first occurrence of the item name
    for (let i = 0; i < jsonLines.length; i++) {
        if (jsonLines[i].includes(`"name": "${itemName}"`) || jsonLines[i].includes(`"name":"${itemName}"`)) {
            return i + 1;
        }
    }
    
    return null;
}

  function buildLootTable() {
    const tbody = lootTable.querySelector('tbody') || (() => {
      const tb = document.createElement('tbody');
      lootTable.appendChild(tb);
      return tb;
    })();
    tbody.innerHTML = "";

    const jsonLines = JSON.stringify(data, null, 2).split("\n");
    itemLineMap = {};
    
    // First pass: count modded items and check for duplicates
    const moddedItems = {};
    const itemCounts = {};
    
    if (!data || !Array.isArray(data.pools)) return;

    // Count all modded items and check for duplicates
    data.pools.forEach(pool => {
      if (!Array.isArray(pool.entries)) return;
      pool.entries.forEach(entry => {
        const entryName = entry.name || (entry.type && entry.type.includes(':') ? entry.type : null);
        if (!entryName) return;

        const itemName = String(entryName);
        const nameLower = itemName.toLowerCase();
        
        // Check if modded
        if (typeof moddedList !== 'undefined' && moddedList.includes(nameLower)) {
          if (!moddedItems[itemName]) {
            moddedItems[itemName] = [];
          }
          moddedItems[itemName].push(entry);
        }
        
        // Count all items for duplicate detection
        if (!itemCounts[itemName]) {
          itemCounts[itemName] = 0;
        }
        itemCounts[itemName]++;
      });
    });

    // Second pass: build the table
    const nameCount = {};

    data.pools.forEach(pool => {
      if (!Array.isArray(pool.entries)) return;
      pool.entries.forEach(entry => {
        const entryName = entry.name || (entry.type && entry.type.includes(':') ? entry.type : null);
        if (!entryName) return;

        const itemName = String(entryName);
        const rawBase = itemName.replace(/^minecraft:/i, '');
        const formattedBase = typeof formatItemName === 'function' ? formatItemName(rawBase) : rawBase;

        const nameLower = itemName.toLowerCase();
        
        // Check if modded and has duplicates
        const isModded = typeof moddedList !== 'undefined' && moddedList.includes(nameLower);
        const hasDuplicates = itemCounts[itemName] > 1;
        
        let itemId = '';
        let uniqueKey = rawBase;
        
        // If modded AND has duplicates AND has an ID, use the ID
        if (isModded && hasDuplicates && entry.id) {
          itemId = entry.id;
          uniqueKey = `${rawBase}_${itemId}`;
        }

        if (!nameCount[uniqueKey]) nameCount[uniqueKey] = 1;
        else nameCount[uniqueKey]++;

        // Create display name
        let displayName;
        if (itemId) {
          // Modded duplicate with ID: "Minecoin (Java Marketplace)"
          displayName = `${formattedBase} (${itemId})`;
        } else if (hasDuplicates) {
          // Duplicate without ID: "Minecoin (2)"
          displayName = nameCount[uniqueKey] === 1
            ? formattedBase
            : `${formattedBase} (${nameCount[uniqueKey]})`;
        } else {
          // No duplicates: "Minecoin"
          displayName = formattedBase;
        }

        const quantity = parseQuantity(entry);

        let emoji = '⚪';
        if (typeof vanillaList !== 'undefined' && vanillaList.includes(nameLower)) {
          emoji = '🟢';
        } else if (isModded) {
          emoji = '🔵';
        } else if (!entry.name) {
          emoji = '🔴';
        }

        const displayImageName = itemName.replace(/^minecraft:/i, '');
        const imagePath = window.getImagePath ? window.getImagePath(itemName) : `http://localhost:3000/images/${displayImageName}.png`;

        // Use the improved line finding function that accounts for IDs
        const lineNum = findItemLine(entry, jsonLines);
        if (lineNum) itemLineMap[uniqueKey] = lineNum;

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="width:20px;text-align:center;">${emoji}</td>
          <td style="width:20px;text-align:center;">
            <img src="${imagePath}" alt="${displayImageName}" style="width:24px;height:24px;object-fit:contain;" onerror="this.style.display='none'">
          </td>
          <td style="text-align:center;">${displayName}</td>
          <td style="width:60px;text-align:center;">${quantity}</td>
        `;

        if (lineNum) {
          tr.title = `Line ${lineNum}`;
        } else {
          tr.title = '';
        }

        tr.addEventListener('mouseenter', () => {
          if (lineNum) highlightLine(lineNum);
        });

        tr.addEventListener('click', () => {
          if (lineNum) scrollAndHighlight(lineNum);
        });

        tbody.appendChild(tr);
      });
    });
  }

  function loadDataFromStorage() {
    const storedData = localStorage.getItem('lootTableData');
    const storedFileName = localStorage.getItem('lootTableFileName');
    
    if (!storedData || !storedFileName) {
      alert('No loot table data found. Please upload a JSON file first.');
      window.location.href = 'index.html';
      return;
    }

    try {
      data = JSON.parse(storedData);
      currentFileName = storedFileName;
      fileBar.textContent = currentFileName;
      updateGlobalData();

      jsonOutput.textContent = JSON.stringify(data, null, 2) + "\n";
      updateLineNumbers();
      buildLootTable();

      mainScreen.style.display = 'flex';
    } catch (err) {
      alert('Error loading stored data: ' + (err.message || err));
      window.location.href = 'index.html';
    }
  }

  jsonOutput.addEventListener('input', () => {
    updateLineNumbers();
    try {
      const parsed = JSON.parse(jsonOutput.textContent);
      data = parsed;
      updateGlobalData();
      buildLootTable();
    } catch (err) {
      // ignore invalid JSON while typing
    }
  });

  backBtn.addEventListener('click', () => {
    // Clear storage and redirect to index.html
    localStorage.removeItem('lootTableData');
    localStorage.removeItem('lootTableFileName');
    window.location.href = 'index.html';
  });

  graphBtn.addEventListener('click', () => {
    if (!data) {
      alert("Load a JSON file first");
      return;
    }
    modal.style.display = 'block';
    if (typeof window.renderGraph === 'function') {
      window.renderGraph(data, currentFileName);
    }
  });

  simulateBtn.addEventListener('click', () => {
    if (!data) {
      alert("Load a JSON file first");
      return;
    }
    // Simulation modal will be handled by simulate.js
  });

  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  window.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
  });

  window._lt_debug.handleFile = loadDataFromStorage;
  window._lt_debug.buildLootTable = buildLootTable;
  window._lt_debug.getData = () => data;
  window._lt_debug.currentFileName = () => currentFileName;

  // Initialize the page
  loadDataFromStorage();
});