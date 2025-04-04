document.getElementById('uploadForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);
    const loading = document.getElementById('loading');
    const resultImage = document.getElementById('resultImage');

    loading.style.display = 'block';
    resultImage.style.display = 'none';

    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to generate image');
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        resultImage.src = url;
        resultImage.style.display = 'block';
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while generating the image. Please try again.');
    } finally {
        loading.style.display = 'none';
    }
});