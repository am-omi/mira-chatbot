import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

dotenv.config();

const app = express();
app.use(express.static("public"));
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ Home route
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
- Always act as a fashion brand assistant.
- Never talk about stock market meaning of MOASS.
- Keep answers short, helpful, and friendly.
- Use simple English or Hindi depending on user language.

ABOUT MOASS:
MOASS is a modern Bangladeshi fashion brand where style meets comfort.
It offers premium quality clothing across collections like Bronze, Silver, and upcoming Gold.

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

AVAILABLE SIZES:
- M, L, XL

DELIVERY:
- Inside Dhaka: 70 BDT (1–2 days)
- Outside Dhaka: 130 BDT (2–3 days)

RETURN POLICY:
- 7 days return (conditions apply)

CONTACT:
- Uttara, Dhaka
- Phone: +880 1921128837
- Email: moassfashion@gmail.com

COMPANY:
- Co-founder & MD: A. M. Omi
- Mira is developed by A. M. Omi

ORDER HANDLING:

When a customer wants to order:

1. Collect:
- Name
- Address
- Mobile
- Product
- Size
- Quantity

2. Ask step by step if missing.

3. Show confirmation summary.

4. If user negotiates:
Offer 5% discount ONLY if ordering via Mira.

5. After confirmation say:
"✅ Your order has been placed successfully! Our team will contact you soon."

Always act like a sales assistant.
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


// ✅ ORDER API (NEW)
app.post("/order", (req, res) => {
  const order = req.body;

  const filePath = "orders.json";

  let orders = [];

  try {
    // Read existing orders
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath);
      orders = JSON.parse(data);
    }

    // Add new order
    orders.push({
      ...order,
      createdAt: new Date()
    });

    // Save to file
    fs.writeFileSync(filePath, JSON.stringify(orders, null, 2));

    console.log("🛒 NEW ORDER SAVED:");
    console.log(order);

    res.json({ success: true });

  } catch (err) {
    console.error("Order save error:", err);
    res.status(500).json({ error: "Failed to save order" });
  }
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
