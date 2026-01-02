
// --- Elements ---
const imageInput = document.getElementById('image-input');
const imageDropZone = document.getElementById('image-drop-zone');
const qualitySlider = document.getElementById('quality-slider');
const qualityValue = document.getElementById('quality-value');
const downloadImgBtn = document.getElementById('download-img-btn');

const pdfInput = document.getElementById('pdf-input');
const pdfDropZone = document.getElementById('pdf-drop-zone');
const downloadPdfBtn = document.getElementById('download-pdf-btn');

const loadingOverlay = document.getElementById('loading');

// --- Global Variables to store processed files ---
let compressedImageBlob = null;
let optimizedPdfBytes = null;

// --- Tab Switching Logic ---
function switchTab(tab) {
    document.querySelectorAll('.compression-section').forEach(el => el.classList.remove('active-section'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    
    if(tab === 'image') {
        document.getElementById('image-section').classList.add('active-section');
        document.querySelectorAll('.tab-btn')[0].classList.add('active');
    } else {
        document.getElementById('pdf-section').classList.add('active-section');
        document.querySelectorAll('.tab-btn')[1].classList.add('active');
    }
}

// --- Utility: Format File Size ---
function formatSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ==============================
// IMAGE COMPRESSION LOGIC
// ==============================

// Update slider value display
qualitySlider.addEventListener('input', (e) => {
    qualityValue.innerText = e.target.value;
});

// Trigger file input on click
imageDropZone.addEventListener('click', () => imageInput.click());

// Handle Image Selection
imageInput.addEventListener('change', async function (event) {
    const file = event.target.files[0];
    if (!file) return;
    processImage(file);
});

async function processImage(file) {
    loadingOverlay.style.display = 'flex';
    
    // Options for browser-image-compression
    const options = {
        maxSizeMB: 1, // Start aiming for 1MB
        maxWidthOrHeight: 1920, // Resize if too huge
        useWebWorker: true,
        initialQuality: parseFloat(qualitySlider.value) // Use slider value
    };

    try {
        // Compress
        compressedImageBlob = await imageCompression(file, options);
        
        // Update UI
        document.getElementById('img-original-size').innerText = formatSize(file.size);
        document.getElementById('img-compressed-size').innerText = formatSize(compressedImageBlob.size);
        document.getElementById('image-preview-area').style.display = 'block';
        
    } catch (error) {
        console.error(error);
        alert('Error compressing image.');
    } finally {
        loadingOverlay.style.display = 'none';
    }
}

// Handle Image Download
downloadImgBtn.addEventListener('click', () => {
    if (!compressedImageBlob) return;
    const url = URL.createObjectURL(compressedImageBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compressed_${Date.now()}.jpg`;
    a.click();
    URL.revokeObjectURL(url);
});

// ==============================
// PDF OPTIMIZATION LOGIC
// ==============================

// Trigger file input on click
pdfDropZone.addEventListener('click', () => pdfInput.click());

// Handle PDF Selection
pdfInput.addEventListener('change', async function(event) {
    const file = event.target.files[0];
    if(!file) return;
    processPdf(file);
});

async function processPdf(file) {
    loadingOverlay.style.display = 'flex';

    try {
        const arrayBuffer = await file.arrayBuffer();
        
        // Load the PDF Document using pdf-lib
        const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
        
        // Saving the document cleans up the XRef table and removes unused objects
        // This is "structural optimization"
        optimizedPdfBytes = await pdfDoc.save();

        // Calculate sizes
        const originalSize = file.size;
        const newSize = optimizedPdfBytes.byteLength;

        // Update UI
        document.getElementById('pdf-original-size').innerText = formatSize(originalSize);
        document.getElementById('pdf-compressed-size').innerText = formatSize(newSize);
        document.getElementById('pdf-preview-area').style.display = 'block';

    } catch (error) {
        console.error(error);
        alert('Error processing PDF. Ensure it is a valid PDF file.');
    } finally {
        loadingOverlay.style.display = 'none';
    }
}

// Handle PDF Download
downloadPdfBtn.addEventListener('click', () => {
    if(!optimizedPdfBytes) return;
    const blob = new Blob([optimizedPdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `optimized_${Date.now()}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
});

// Drag and Drop Effects (Optional Visuals)
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    imageDropZone.addEventListener(eventName, preventDefaults, false);
    pdfDropZone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

imageDropZone.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files[0];
    if(file && file.type.startsWith('image/')) processImage(file);
});

pdfDropZone.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files[0];
    if(file && file.type === 'application/pdf') processPdf(file);
});

