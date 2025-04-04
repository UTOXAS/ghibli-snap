const express = require('express');
const multer = require('multer');
const mime = require('mime-types');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // Use memory storage instead of disk

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp-image-generation",
});

const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseModalities: ["image", "text"],
    responseMimeType: "text/plain"
};

const PROMPT_TEMPLATE = `Please generate a detailed text prompt for an AI image generator. The generated prompt must begin with the phrase 'Generate an image of...'. This prompt should describe an image in enough detail to be recreated in the classic Studio Ghibli anime style. The generated prompt must explicitly include both 'Studio Ghibli' and 'anime'. Avoid referencing any specific original image directly. Instead, provide a comprehensive description of the scene, characters, and overall aesthetic, as if the AI has no visual reference.
The generated prompt should capture every single detail of the image, no matter how small. This includes, but is not limited to:
 * Characters: Their shape, features, hair, clothes, position, age, gender, and expressions.
 * Elements and Objects: Their shape, positioning, texture, and any other relevant characteristics.
 * Background: Its shape, depth, and any details that contribute to the overall scene.
The overall mood of the image should be serene and contemplative, reminiscent of scenes from films like 'Whisper of the Heart' or 'Only Yesterday'. The image should evoke a sense of warmth and familiarity, with a focus on capturing the character's personality and the quiet beauty of the moment. The style should emphasize soft, hand-painted textures, with a gentle color palette dominated by warm tones like soft oranges, golden yellows, and gentle browns, reflecting a cozy, inviting aesthetic. The composition should be natural and unposed, as if capturing a fleeting, candid moment of everyday life. The scene should be filled with a soft, diffused glow, creating a gentle, inviting atmosphere, as if light is being filtered through a warm medium. This glow should enhance the sense of peacefulness and nostalgia. Ensure that every aspect of the scene, including lighting and shadows, is thoroughly described in the generated prompt.`;

router.post('/generate', upload.single('image'), async (req, res) => {
    try {
        const existingPrompt = req.body.prompt;

        // Regenerate case: Use existing prompt, no file upload needed
        if (existingPrompt) {
            const imageSession = model.startChat({ generationConfig });
            const imageResult = await imageSession.sendMessage(existingPrompt);
            const candidates = imageResult.response.candidates;

            let imageBuffer;
            for (const candidate of candidates) {
                for (const part of candidate.content.parts) {
                    if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                        imageBuffer = Buffer.from(part.inlineData.data, 'base64');
                        break;
                    }
                }
                if (imageBuffer) break;
            }

            if (!imageBuffer) {
                throw new Error('No image generated');
            }

            return res.json({ image: imageBuffer.toString('base64'), prompt: existingPrompt });
        }

        // Generate case: Expect a file upload
        if (!req.file) {
            return res.status(400).send('No image file uploaded');
        }

        const mimeType = req.file.mimetype || 'image/jpeg';
        const fileData = {
            inlineData: {
                data: req.file.buffer.toString('base64'),
                mimeType: mimeType,
            },
        };

        const promptSession = model.startChat({
            generationConfig,
            history: [
                {
                    role: "user",
                    parts: [
                        fileData,
                        { text: PROMPT_TEMPLATE },
                    ],
                },
            ],
        });

        const promptResult = await promptSession.sendMessage("Generate the prompt as requested.");
        const generatedPrompt = promptResult.response.text();

        const imageSession = model.startChat({ generationConfig });
        const imageResult = await imageSession.sendMessage(generatedPrompt);
        const candidates = imageResult.response.candidates;

        let imageBuffer;
        for (const candidate of candidates) {
            for (const part of candidate.content.parts) {
                if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                    imageBuffer = Buffer.from(part.inlineData.data, 'base64');
                    break;
                }
            }
            if (imageBuffer) break;
        }

        if (!imageBuffer) {
            throw new Error('No image generated');
        }

        res.json({ image: imageBuffer.toString('base64'), prompt: generatedPrompt });
    } catch (error) {
        console.error('Error in /api/generate:', error);
        res.status(500).send(`Failed to generate image: ${error.message}`);
    }
});

module.exports = router;