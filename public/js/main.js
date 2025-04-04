const uploadForm = document.getElementById('uploadForm');
const generateBtn = document.getElementById('generateBtn');
const regenerateBtn = document.getElementById('regenerateBtn');
const imageInput = document.getElementById('imageInput');
const loading = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const results = document.getElementById('results');
const promptSection = document.getElementById('promptSection');
const promptOutput = document.getElementById('promptOutput');
const copyBtn = document.getElementById('copyBtn');

// Get token from URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

let currentPrompt = '';

// Enable Generate button when an image is selected
imageInput.addEventListener('change', () => {
    generateBtn.disabled = !imageInput.files.length;
    regenerateBtn.disabled = true; // Reset Regenerate state
    promptSection.style.display = 'none';
    results.innerHTML = '';
});

uploadForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    await generateImage(true); // Generate new prompt and image
});

regenerateBtn.addEventListener('click', async () => {
    await generateImage(false); // Use existing prompt
});

copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(promptOutput.value)
        .then(() => alert('Prompt copied to clipboard!'))
        .catch(err => console.error('Failed to copy:', err));
});

async function generateImage(generateNewPrompt) {
    loading.style.display = 'block';
    errorDiv.style.display = 'none';
    results.innerHTML = '';

    try {
        let response;
        if (generateNewPrompt) {
            // Generate case: Send image file
            const formData = new FormData(uploadForm);
            response = await fetch(`/api/generate?token=${token}`, {
                method: 'POST',
                body: formData
            });
        } else {
            // Regenerate case: Send only the prompt
            response = await fetch(`/api/generate?token=${token}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ prompt: currentPrompt })
            });
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to generate image');
        }

        const data = await response.json();
        const base64 = data.image;
        currentPrompt = data.prompt;

        // Display prompt
        promptOutput.value = currentPrompt;
        promptSection.style.display = 'block';
        regenerateBtn.disabled = false;

        // Display image with download button
        const img = document.createElement('img');
        img.src = `data:image/png;base64,${base64}`;
        const downloadBtn = document.createElement('button');
        downloadBtn.textContent = 'Download Image';
        downloadBtn.className = 'btn download-btn';
        downloadBtn.onclick = () => downloadImage(img.src, 'ghibli-snap-image.png');
        const div = document.createElement('div');
        div.className = 'result-item';
        div.appendChild(img);
        div.appendChild(downloadBtn);
        results.appendChild(div);
    } catch (error) {
        console.error('Error:', error);
        errorDiv.textContent = `Error: ${error.message}`;
        errorDiv.style.display = 'block';
    } finally {
        loading.style.display = 'none';
    }
}

function downloadImage(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}