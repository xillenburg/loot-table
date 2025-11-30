# Loot Table Analyzer - Setup Instructions

## Note
### I did not implement a generic backend feature like **"user login"** as this website does not need it. The entire backend feature is a simple **"backend finds the images in its folder and sends them back to show on your screen."**

## How to use deployed website

- Open my [website](https://loot-table.onrender.com)
- Upload a loot table JSON file located at "loot table/sample json" and pick any of the two .json samples **OR** press here to auto-download a `.json` sample 
[ancient_city.json](https://github.com/user-attachments/files/23837943/ancient_city.json)

- Images should load from backend server

## Architecture Notes
- Frontend: Pure HTML/CSS/JS
- Backend: Node.js/Express serving static images
- Communication: Frontend fetches images from backend API
- No database - images served directly from filesystem

## PRELIMS Files
- My Canva presentation: https://www.canva.com/design/DAG0UUGvngo/lPFt-ZiMDxzpRNzy_2LMbw/edit?utm_content=DAG0UUGvngo&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton
- Loot table on Minecraft https://youtu.be/9oK3Bve5Rts
