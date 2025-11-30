// file-handler.js
function setupFileHandling(uploadBox, fileInput, onFileLoaded) {
    // Handle file input change
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFile(e.target.files[0], onFileLoaded);
        }
    });

    // Initialize drag and drop
    function initDropZone() {
        if (!uploadBox) return;
        
        uploadBox.addEventListener('dragover', (ev) => {
            ev.preventDefault();
            uploadBox.classList.add('dragover');
        });
        
        uploadBox.addEventListener('dragleave', (ev) => {
            ev.preventDefault();
            uploadBox.classList.remove('dragover');
        });
        
        uploadBox.addEventListener('drop', (ev) => {
            ev.preventDefault();
            uploadBox.classList.remove('dragover');
            if (ev.dataTransfer.files.length) {
                handleFile(ev.dataTransfer.files[0], onFileLoaded);
            }
        });
    }
    
    initDropZone();
}

function handleFile(file, onFileLoaded) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            onFileLoaded(data, file.name);
        } catch (err) {
            alert('Invalid JSON file: ' + (err.message || err));
        }
    };
    
    reader.onerror = (err) => {
        alert('Failed to read file: ' + (err?.message || err));
    };
    
    reader.readAsText(file);
}