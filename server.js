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

// 🧠 Simple memory
const orders = {};

// ✅ HOME
app.get("/", (req, res) => {
  res.send("Mira AI is running 🚀");
});


// ✅ CHAT API (NO LOOP + AUTO ORDER)
app.post("/chat", async (req, res) => {
  const { message, userId = "user1" } = req.body;

  try {
    if (!orders[userId]) {
      orders[userId] = {
        name: "",
        address: "",
        phone: "",
        product: "",
        size: "",
        quantity: ""
      };
    }

    const order = orders[userId];
    const msg = message.toLowerCase();

    // 🧠 Extract data automatically
    if (!order.phone && (msg.includes("01") || msg.match(/\d{10,}/))) {
      order.phone = message;
    }

    if (!order.name && msg.includes("name")) {
      order.name = message;
    }

    if (!order.address && msg.includes("address")) {
      order.address = message;
    }

    if (!order.product && (msg.includes("shirt") || msg.includes("hoodie") || msg.includes("panjabi"))) {
      order.product = message;
    }

    if (!order.size && (msg.includes("m") || msg.includes("l") || msg.includes("xl"))) {
      order.size = message;
    }

    const qty = message.match(/\d+/);
    if (!order.quantity && qty) {
      order.quantity = qty[0];
    }

    // ✅ CHECK COMPLETE ORDER
    const isComplete =
      order.name &&
      order.address &&
      order.phone &&
      order.product &&
      order.size &&
      order.quantity;

    // 🚀 AUTO CONFIRM (NO LOOP)
    if (isComplete) {
      await fetch("https://script.google.com/macros/s/AKfycbyUOFZKDq_i3dRoy02HrC4A9q-s8nGL-4C2tTAIZkmIQG1USGPIK61GRFyR2EWkmisq/exec", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(order)
      });

      // reset for next order
      orders[userId] = {};

      return res.json({
        reply: `✅ Your order has been placed successfully!

Details:
Name: ${order.name}
Product: ${order.product}
Size: ${order.size}
Quantity: ${order.quantity}

Our team will contact you soon.`
      });
    }

    // 🤖 NORMAL AI RESPONSE (ONLY WHEN NOT COMPLETE)
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 120,
      messages: [
        {
          role: "system",
          content: `
You are Mira, assistant of MOASS clothing brand.

Rules:
- Do NOT repeat questions
- Ask only missing info
- Keep it short

Ask for:
Name, Address, Phone, Product, Size, Quantity

Example:
"Please tell me your size (M/L/XL)"
`
        },
        {
          role: "user",
          content: message
        }
      ]
    });

    res.json({
      reply: response.choices[0].message.content
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error" });
  }
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
