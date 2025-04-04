# Ghibli Snap

A web tool to transform real images into Studio Ghibli anime style.

## Setup

1. Clone the repository:

   ```powershell
   git clone https://github.com/utoxas/ghibli-snap.git
   cd ghibli-snap
   ```

2. Install dependencies:

   ```powershell
   npm install
   ```

3. Run locally:

   ```powershell
   npm run dev
   ```

## Deployment

1. Push to GitHub:

   ```powershell
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. Deploy to Vercel:
   - Link your GitHub repo to Vercel.
   - Set the environment variable `GEMINI_API_KEY` in Vercel dashboard.

## Usage

- Upload an image via the web interface.
- Wait for the Studio Ghibli-style image to be generated and displayed.
