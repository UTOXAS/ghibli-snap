const express = require('express');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const mime = require('mime-types');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GoogleAIFileManager } = require('@google/generative-ai/server');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

require('dotenv').config();

// Securely access API key from environment variables
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

// Initialize Gemini model
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp-image-generation",
});

const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseModalities: ["image", "text"],
    responseMimeType: "image/png" // Expecting an image output
};

// Function to upload file to Gemini
async function uploadToGemini(filePath, mimeType) {
    const uploadResult = await fileManager.uploadFile(filePath, {
        mimeType,
        displayName: path.basename(filePath),
    });
    return uploadResult.file;
}

// Prompt template
const PROMPT_TEMPLATE = `Please generate a detailed text prompt for an AI image generator. The generated prompt must begin with the phrase 'Generate an image of...'. This prompt should describe an image in enough detail to be recreated in the classic Studio Ghibli anime style. The generated prompt must explicitly include both 'Studio Ghibli' and 'anime'. Avoid referencing any specific original image directly. Instead, provide a comprehensive description of the scene, characters, and overall aesthetic, as if the AI has no visual reference.
The generated prompt should capture every single detail of the image, no matter how small. This includes, but is not limited to:
 * Characters: Their shape, features, hair, clothes, position, age, gender, and expressions.
 * Elements and Objects: Their shape, positioning, texture, and any other relevant characteristics.
 * Background: Its shape, depth, and any details that contribute to the overall scene.
The overall mood of the image should be serene and contemplative, reminiscent of scenes from films like 'Whisper of the Heart' or 'Only Yesterday'. The image should evoke a sense of warmth and familiarity, with a focus on capturing the character's personality and the quiet beauty of the moment. The style should emphasize soft, hand-painted textures, with a gentle color palette dominated by warm tones like soft oranges, golden yellows, and gentle browns, reflecting a cozy, inviting aesthetic. The composition should be natural and unposed, as if capturing a fleeting, candid moment of everyday life. The scene should be filled with a soft, diffused glow, creating a gentle, inviting atmosphere, as if light is being filtered through a warm medium. This glow should enhance the sense of peacefulness and nostalgia. Ensure that every aspect of the scene, including lighting and shadows, is thoroughly described in the generated prompt.`;

// API endpoint to handle image upload and generation
router.post('/generate', upload.single('image'), async (req, res) => {
    let filePath;
    try {
        filePath = req.file.path;
        const mimeType = mime.lookup(filePath) || 'image/jpeg';

        // Upload file to Gemini
        const uploadedFile = await uploadToGemini(filePath, mimeType);

        // Start chat session
        const chatSession = model.startChat({
            generationConfig,
            history: [
                {
                    role: "user",
                    parts: [
                        {
                            fileData: {
                                mimeType: uploadedFile.mimeType,
                                fileUri: uploadedFile.uri,
                            },
                        },
                        { text: PROMPT_TEMPLATE },
                    ],
                },
            ],
        });

        // Generate the image directly
        const result = await chatSession.sendMessage("Generate the image based on the prompt you created.");
        const candidates = result.response.candidates;

        // Extract the generated image
        let imageBuffer;
        for (const candidate of candidates) {
            for (const part of candidate.content.parts) {
                if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                    imageBuffer = Buffer.from(part.inlineData.data, 'base64');
                    res.set('Content-Type', part.inlineData.mimeType);
                    break;
                }
            }
            if (imageBuffer) break;
        }

        if (!imageBuffer) {
            throw new Error('No image generated');
        }

        // Send the image as a response
        res.send(imageBuffer);
    } catch (error) {
        console.error('Error in /api/generate:', error);
        res.status(500).send(`Internal Server Error: ${error.message}`);
    } finally {
        // Clean up temporary file
        if (filePath) {
            await fs.unlink(filePath).catch(err => console.error('Cleanup error:', err));
        }
    }
});

module.exports = router;