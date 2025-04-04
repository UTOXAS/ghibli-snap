# Ghibli Snap

A web tool to transform real images into Studio Ghibli anime style. Restricted to two users via a shared secret token.

## Setup

1. Clone the repository:

   ```powershell
   git clone <https://github.com/utoxas/ghibli-snap.git>
   cd ghibli-snap
   ```

2. Install dependencies:

   ```powershell
   npm install
   ```

3. Create a `.env` file in the root directory with:

   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   SECRET_TOKEN=your_random_secret_token_here
   PORT=3000
   ```

4. Run locally:

   ```powershell
   npm run dev
   ```

5. Access the site at `http://localhost:3000/?token=your_random_secret_token_here`.

## Deployment

1. Push to GitHub:

   ```powershell
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. Deploy to Vercel:
   - Link your GitHub repo to Vercel.
   - Set environment variables `GEMINI_API_KEY` and `SECRET_TOKEN` in the Vercel dashboard.

3. Access the deployed site with the token, e.g., `https://your-vercel-app.vercel.app/?token=your_random_secret_token_here`.

## Usage

- Open the site with the correct token in the URL (e.g., `?token=your_random_secret_token_here`).
- Upload an image via the web interface.
- Click "Generate Prompt" to create an editable Studio Ghibli-style prompt.
- Adjust the prompt if desired, select the number of images (1–4), and click "Generate Images".
- Download individual images or all at once.
