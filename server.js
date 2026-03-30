import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path";

dotenv.config();

const app = express();
app.use(express.static("public"));
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get("/", (req, res) => {
  res.send("Mira AI is running 🚀");
});

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // ✅ better & cheaper model
      max_tokens: 150,
      messages: [
        {
          role: "system",
          content: `
You are Mira, an AI assistant for MOASS clothing brand.

MOASS is a fashion brand (NOT stock market).
It sells stylish shirts, panjabi, and modern outfits.

Your job:
- Help customers choose outfits
- Suggest styles
- Answer product questions
- Be friendly and professional

Never talk about stock market meaning of MOASS.
Always treat MOASS as a clothing brand.

Use simple English or Hindi depending on user language.
Keep answers short and helpful.
`
        },
        {
          role: "user",
          content: userMessage
        }
      ]
    });

    res.json({
      reply: response.choices[0].message.content
    });

  } catch (err) {
    console.error(err); // ✅ helpful for debugging
    res.status(500).json({ error: "Error generating response" });
  }
});

const PORT = process.env.PORT || 5000; // ✅ important for Render

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
