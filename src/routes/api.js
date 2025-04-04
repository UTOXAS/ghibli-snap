const express = require('express');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const mime = require('mime-types');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Securely access API key from environment variables
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

// Initialize Gemini model
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash", // Use a stable, free-tier model
});

// Prompt template
const PROMPT_TEMPLATE = `Please generate a detailed text prompt for an AI image generator. The generated prompt must begin with the phrase 'Generate an image of...'. This prompt should describe an image in enough detail to be recreated in the classic Studio Ghibli anime style. The generated prompt must explicitly include both 'Studio Ghibli' and 'anime'. Avoid referencing any specific original image directly. Instead, provide a comprehensive description of the scene, characters, and overall aesthetic, as if the AI has no visual reference.
The generated prompt should capture every single detail of the image, no matter how small. This includes, but is not limited to:
 * Characters: Their shape, features, hair, clothes, position, age, gender, and expressions.
 * Elements and Objects: Their shape, positioning, texture, and any other relevant characteristics.
 * Background: Its shape, depth, and any details that contribute to the overall scene.
The overall mood of the image should be serene and contemplative, reminiscent of scenes from films like 'Whisper of the Heart' or 'Only Yesterday'. The image should evoke a sense of warmth and familiarity, with a focus on capturing the character's personality and the quiet beauty of the moment. The style should emphasize soft, hand-painted textures, with a gentle color palette dominated by warm tones like soft oranges, golden yellows, and gentle browns, reflecting a cozy, inviting aesthetic. The composition should be natural and unposed, as if capturing a fleeting, candid moment of everyday life. The scene should be filled with a soft, diffused glow, creating a gentle, inviting atmosphere, as if light is being filtered through a warm medium. This glow should enhance the sense of peacefulness and nostalgia. Ensure that every aspect of the scene, including lighting and shadows, is thoroughly described in the generated prompt.`;

// API endpoint to handle image upload and generation
router.post('/generate', upload.single('image'), async (req, res) => {
    try {
        const filePath = req.file.path;
        const mimeType = mime.lookup(filePath) || 'image/jpeg';

        // Upload file to Gemini
        const fileData = await fs.readFile(filePath);
        const uploadedFile = {
            uri: `data:${mimeType};base64,${fileData.toString('base64')}`,
            mimeType
        };

        // Step 1: Generate the text prompt
        const promptResult = await model.generateContent([
            {
                fileData: {
                    mimeType: uploadedFile.mimeType,
                    fileUri: uploadedFile.uri
                }
            },
            { text: PROMPT_TEMPLATE }
        ]);
        const generatedPrompt = promptResult.response.text();

        // Step 2: Generate the image from the prompt
        const imageResult = await model.generateContent([
            { text: generatedPrompt }
        ]);

        // Extract the generated image (assuming base64 response)
        const imagePart = imageResult.response.candidates[0].content.parts.find(part => part.inlineData);
        if (!imagePart || !imagePart.inlineData) {
            throw new Error('No image generated');
        }

        const imageBuffer = Buffer.from(imagePart.inlineData.data, 'base64');

        // Clean up temporary file
        await fs.unlink(filePath);

        // Send the image as a response
        res.set('Content-Type', imagePart.inlineData.mimeType);
        res.send(imageBuffer);
    } catch (error) {
        console.error('Error in /api/generate:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;