# Loot Table Analyzer - Setup Instructions

## How to use deployed website

- Open my [website](https://loot-table.onrender.com)
- Upload a loot table JSON file located at "loot table/sample json" and pick any of the two .json samples
- OR press here to auto-download a `.json` sample [Uploading ancient_city.json…]()

- Images should load from backend server

## Architecture Notes
- Frontend: Pure HTML/CSS/JS
- Backend: Node.js/Express serving static images
- Communication: Frontend fetches images from backend API
- No database - images served directly from filesystem
