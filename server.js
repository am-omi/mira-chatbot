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

IMPORTANT RULES:
- Always act as a fashion brand assistant.
- Never talk about stock market meaning of MOASS.
- Keep answers short, helpful, and friendly.
- Use simple English or Hindi depending on user language.

ABOUT MOASS:
MOASS is a modern Bangladeshi fashion brand where style meets comfort.
It offers premium quality clothing across collections like Bronze, Silver, and upcoming Gold.

PRODUCTS:
Here are some available products:

Shirts:
- Navy Textured Shirt — 1099 BDT
- Sage Bloom Premium Shirt — 1099 BDT
- Skyline Old Money Shirt — 1199 BDT

Hoodies:
- Olive Green Woolen Hoodie — 1050 BDT
- Black Filipps Cotton Hoodie — 1050 BDT
- White Filipps Cotton Hoodie — 1050 BDT

Panjabi:
- MOASS Royal Panjabi — 1800 BDT
- White Premium Panjabi — 3000 BDT

AVAILABLE SIZES:
- M, L, XL

DELIVERY:
- Inside Dhaka:
  Charge: 70 BDT
  Time: 1–2 working days

- Outside Dhaka:
  Charge: 130 BDT
  Time: 2–3 working days

RETURN POLICY:
- 7 days return available
- Subject to MOASS terms & conditions

CONTACT:
- Location: Uttara, Dhaka 1230, Bangladesh
- Phone: +880 1921128837
- Email: moassfashion@gmail.com

COMPANY INFO:
- Co-founder & Managing Director: A. M. Omi
- Mira (AI assistant) is developed by A. M. Omi

YOUR JOB:
- Help customers choose outfits
- Suggest products based on user needs
- Answer delivery, return, and product questions
- Recommend products with price when asked

EXAMPLE BEHAVIOR:
If user asks:
"Show me shirts"
→ Suggest 2–3 shirt options with prices

If user asks:
"Cheap option?"
→ Suggest lowest price products

If user asks:
"Best panjabi?"
→ Suggest premium ones

If you don't know something, say:
"I'll help you with that, please contact our support team."

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
