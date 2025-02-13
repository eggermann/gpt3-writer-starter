import dotenv from 'dotenv';

dotenv.config();

const basePromptPrefix = "";
const generateAction = async (req, res) => {
    // Run first prompt

    console.log(`API: ${basePromptPrefix}${req.body.userInput}`)

    const geminiApiKey = process.env.GEMINI_API_KEY;
    const geminiResponse = await fetch(`https://generativeai.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `${basePromptPrefix}${req.body.userInput}` }],
        }],
      }),
    });

    if (!geminiResponse.ok) {
      console.error(`Gemini API error: ${geminiResponse.status} ${geminiResponse.statusText}`);
      res.status(500).json({ output: 'Gemini API error' });
      return;
    }

    const geminiData = await geminiResponse.json();
    let geminiOutput = geminiData.candidates[0].content.parts[0].text;

    // Sanitize the output to remove HTML tags
    geminiOutput = geminiOutput.replace(/<[^>]*>/g, '');

    res.status(200).json({ output: geminiOutput });
};

export default generateAction;