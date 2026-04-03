import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import axios from "axios";
import cheerio from "cheerio";

dotenv.config();

const app = express();
app.use(express.static("public"));
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🌐 Website Data Memory
let websiteData = "";

// 🧠 Simple order memory
const orders = {};

// 🌐 SCRAPER FUNCTION
async function scrapeWebsite(url) {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    let text = $("body").text();

    return text.replace(/\s+/g, " ").trim();
  } catch (err) {
    console.error("Scrape error:", err);
    return "";
  }
}

// ✅ HOME
app.get("/", (req, res) => {
  res.send("Mira AI is running 🚀");
});

// 🌐 TRAIN WEBSITE
app.get("/train", async (req, res) => {
  const url = req.query.url;

  if (!url) {
    return res.send("Please provide a URL");
  }

  websiteData = await scrapeWebsite(url);

  console.log("Website data loaded");

  res.send("Website trained successfully ✅");
});

// 💬 CHAT API
app.post("/chat", async (req, res) => {
  const { message, userId = "user1" } = req.body;

  try {
    // Initialize order
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

    // 🧠 Extract order info
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

    // ✅ Check complete order
    const isComplete =
      order.name &&
      order.address &&
      order.phone &&
      order.product &&
      order.size &&
      order.quantity;

    // 🚀 Auto order submit
    if (isComplete) {
      await fetch("https://script.google.com/macros/s/AKfycbyUOFZKDq_i3dRoy02HrC4A9q-s8nGL-4C2tTAIZkmIQG1USGPIK61GRFyR2EWkmisq/exec", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(order)
      });

      orders[userId] = {};

      return res.json({
        reply: `✅ Your order has been placed successfully!

Name: ${order.name}
Product: ${order.product}
Size: ${order.size}
Quantity: ${order.quantity}

Our team will contact you soon.`
      });
    }

    // 🤖 AI RESPONSE (UPDATED WITH WEBSITE DATA)
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 200,
      messages: [
        {
          role: "system",
          content: `
You are Mira, the AI assistant of MOASS.

----------------------------------
WEBSITE DATA (LIVE)
----------------------------------
${websiteData}

----------------------------------
RULES
----------------------------------
- Use WEBSITE DATA first
- If answer not found, use your knowledge
- Keep answers short
- Be friendly and professional
- Never repeat questions

----------------------------------
BRAND INFO
----------------------------------
MOASS is a modern fashion brand.

Products:
Shirts, Hoodies, Panjabi

Sizes:
M, L, XL

Delivery:
Inside Dhaka: 70 BDT and 1-2 days delivery time
Outside Dhaka: 130 BDT and 2-3 days delivery time

Return:
7 days available

Founder:
A. M. Omi

----------------------------------
GOAL
----------------------------------
Help customer and convert into buyer
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

// 🚀 SERVER
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
