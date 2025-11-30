# Loot Table Analyzer - Setup Instructions

## You can either run my website LOCALLY **OR** use my deployed [website ](https://loot-table.onrender.com)
### Proceed to the 'new' branch for further instructions

## 'main' branch is for users who want to run it LOCALLY
## Prerequisites
- Node.js installed (download from https://nodejs.org)

## Quick Start

1. **Open terminal/command prompt** in the project folder

2. **Navigate to backend folder:**
```bash
cd backend
```

3. **Install dependencies:**
```bash
npm install
```

4. **Start the backend server:**
```bash
node server.js
```

5. **You should see:**
```
🚀 Backend server running on http://localhost:3000
📁 Serving images from: [path_to_images_folder]
```

## Verification

**Test frontend:**
- Open `frontend/index.html`
- Upload a loot table JSON file located at "loot table/sample json" and pick any of the two .json samples
- Images should load from backend server

## Architecture Notes
- Frontend: Pure HTML/CSS/JS
- Backend: Node.js/Express serving static images
- Communication: Frontend fetches images from backend API
- No database - images served directly from filesystem
