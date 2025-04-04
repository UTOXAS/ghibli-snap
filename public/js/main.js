const uploadForm = document.getElementById('uploadForm');
const generateImageBtn = document.getElementById('generateImageBtn');
const promptArea = document.getElementById('promptArea');
const imageCount = document.getElementById('imageCount');
const loading = document.getElementById('loading');
const results = document.getElementById('results');
const downloadAllBtn = document.getElementById('downloadAll');

uploadForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);
    loading.style.display = 'block';
    promptArea.style.display = 'none';
    results.innerHTML = '';

    try {
        const response = await fetch('/api/generate-prompt', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to generate prompt');
        }

        const { prompt } = await response.json();
        promptArea.value = prompt;
        promptArea.style.display = 'block';
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while generating the prompt. Please try again.');
    } finally {
        loading.style.display = 'none';
    }
});

generateImageBtn.addEventListener('click', async () => {
    const prompt = promptArea.value.trim();
    const count = parseInt(imageCount.value, 10);

    if (!prompt) {
        alert('Please generate a prompt first.');
        return;
    }

    if (count < 1 || count > 4) {
        alert('Please select a number between 1 and 4.');
        return;
    }

    loading.style.display = 'block';
    results.innerHTML = '';
    downloadAllBtn.style.display = 'none';

    try {
        const response = await fetch('/api/generate-images', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, count })
        });

        if (!response.ok) {
            throw new Error('Failed to generate images');
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
        alert('An error occurred while generating the images. Please try again.');
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