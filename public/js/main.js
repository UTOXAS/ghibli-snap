const uploadForm = document.getElementById('uploadForm');
const generateBtn = document.getElementById('generateBtn');
const imageInput = document.getElementById('imageInput');
const imageCount = document.getElementById('imageCount');
const imageCountLabel = document.getElementById('imageCountLabel');
const loading = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const results = document.getElementById('results');
const downloadAllBtn = document.getElementById('downloadAll');

// Get token from URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

// Update slider label dynamically
imageCount.addEventListener('input', () => {
    imageCountLabel.textContent = imageCount.value;
});

// Enable Generate button when an image is selected
imageInput.addEventListener('change', () => {
    generateBtn.disabled = !imageInput.files.length;
});

uploadForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);
    formData.append('count', imageCount.value);
    loading.style.display = 'block';
    errorDiv.style.display = 'none';
    results.innerHTML = '';
    downloadAllBtn.style.display = 'none';

    try {
        const response = await fetch(`/api/generate?token=${token}`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to generate images');
        }

        const blobs = await response.json();
        blobs.forEach((base64, index) => {
            const img = document.createElement('img');
            img.src = `data:image/png;base64,${base64}`;
            const downloadBtn = document.createElement('button');
            downloadBtn.textContent = `Download Image ${index + 1}`;
            downloadBtn.className = 'btn download-btn';
            downloadBtn.onclick = () => downloadImage(img.src, `ghibli-image-${index + 1}.png`);
            const div = document.createElement('div');
            div.className = 'result-item';
            div.appendChild(img);
            div.appendChild(downloadBtn);
            results.appendChild(div);
        });

        if (blobs.length > 1) {
            downloadAllBtn.style.display = 'block';
            downloadAllBtn.onclick = () => downloadAllImages(blobs);
        }
    } catch (error) {
        console.error('Error:', error);
        errorDiv.textContent = `Error: ${error.message}`;
        errorDiv.style.display = 'block';
    } finally {
        loading.style.display = 'none';
    }
});

function downloadImage(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function downloadAllImages(blobs) {
    blobs.forEach((base64, index) => {
        const url = `data:image/png;base64,${base64}`;
        downloadImage(url, `ghibli-image-${index + 1}.png`);
    });
}