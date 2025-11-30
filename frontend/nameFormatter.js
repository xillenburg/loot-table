// nameFormatter.js
function formatItemName(name) {
  if (!name) return "";
  let cleanName = name.replace("minecraft:", "");
  return cleanName
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Make it globally available
window.formatItemName = formatItemName;
