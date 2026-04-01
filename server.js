import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(express.static("public"));
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ HOME
app.get("/", (req, res) => {
  res.send("Mira AI is running 🚀");
});

// ✅ CHAT API
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 150,
      messages: [
        {
          role: "system",
          content: `
You are Mira, an AI assistant for MOASS clothing brand.

IMPORTANT RULES:
- Always act as a fashion brand assistant
- Keep answers short and helpful
- Use simple English or Hindi

ABOUT MOASS:
Modern Bangladeshi fashion brand focused on style & comfort.

PRODUCTS:

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

SIZES:
M, L, XL

DELIVERY:
Inside Dhaka: 70 BDT (1–2 days)
Outside Dhaka: 130 BDT (2–3 days)

RETURN:
7 days (conditions apply)

CONTACT:
Uttara, Dhaka
Phone: +880 1921128837

COMPANY:
A. M. Omi (Co-founder & MD)

ORDER SYSTEM:

1. Collect:
Name, Address, Phone, Product, Size, Quantity

2. Ask step by step

3. Show confirmation summary

4. If negotiate:
Offer 5% discount only via Mira

5. After confirmation say EXACT:
"✅ Your order has been placed successfully! Our team will contact you soon."

Always try to complete order.
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
    console.error(err);
    res.status(500).json({ error: "Error generating response" });
  }
});


// ✅ ORDER API → GOOGLE SHEET
app.post("/order", async (req, res) => {
  const order = req.body;

  try {
    console.log("🛒 New Order:", order);

    const response = await fetch("https://script.google.com/macros/s/AKfycbyUOFZKDq_i3dRoy02HrC4A9q-s8nGL-4C2tTAIZkmIQG1USGPIK61GRFyR2EWkmisq/exec", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(order)
    });

    const result = await response.text();

    console.log("✅ Google Sheet Response:", result);

    res.json({ success: true });

  } catch (err) {
    console.error("❌ Order Error:", err);
    res.status(500).json({ error: "Failed to send order" });
  }
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
