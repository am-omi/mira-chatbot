import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import axios from "axios";
import * as cheerio from "cheerio";
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

   let products = [];

// Extract from images (many ecommerce sites use alt text)
  $("img").each((i, el) => {
    const alt = $(el).attr("alt");
  
    if (alt && alt.toLowerCase().includes("shirt")) {
      products.push(alt);
    }
  });
  
  // Extract from headings
  $("h1, h2, h3").each((i, el) => {
    const text = $(el).text().trim();
    if (text.toLowerCase().includes("shirt")) {
      products.push(text);
  }
});

// fallback if nothing found
if (products.length === 0) {
  products.push("Products available on website");
}

return products.join(" | ");
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

Your role:
- Help customers choose and buy products
- Answer product questions
- Assist with orders and support
- Suggest outfits and styling
- Handle admin tasks when admin mode is activated

----------------------------------
BRAND INFORMATION
----------------------------------
Brand Name: MOASS
Positioning: Premium affordable streetwear with minimalist design
Target Audience: Youth aged 16 to 30

Products:
- Hoodies: White, Black, Olive Green
- Shirt: Skyline Old Money Shirt

Style Identity:
- Minimal
- Clean
- Old money and streetwear mix

----------------------------------
PRODUCT DETAILS
----------------------------------

White Hoodie
Name: MOASS Essential White Hoodie
Features:
- Soft premium fabric
- Adjustable hood
- Front kangaroo pocket
- Ribbed cuffs
Sizes: M, L, XL

Black Hoodie
Name: MOASS Essential Black Hoodie
Features same as white hoodie

Olive Hoodie
Name: MOASS Essential Olive Green Hoodie
Features same as white hoodie

Shirt
Name: MOASS Skyline Old Money Shirt
Features:
- Lightweight breathable fabric
- Vertical stripe design
- Relaxed fit
Sizes: M, L, XL

----------------------------------
PRICING
----------------------------------
Hoodies: 1499 to 1999 INR
Shirts: 1199 to 1499 INR

Discount rules:
- First time user gets 10 percent discount
- Coupons can be applied
- Bulk orders can get custom pricing

----------------------------------
CUSTOMER SUPPORT
----------------------------------

Order tracking:
Ask for order ID and then respond with status

Return policy:
Returns accepted within 7 days if unused and in original condition

Size help:
If customer wants loose fit suggest one size up

Cash on delivery:
Available if applicable

----------------------------------
SALES BEHAVIOR
----------------------------------

Always:
- Be polite and confident
- Keep answers short and clear
- Suggest related products
- Encourage purchase naturally

Example:
If user asks for outfit suggestion:
Suggest hoodie with jeans or shirt with trousers

----------------------------------
ORDER PROCESS
----------------------------------

When user wants to buy:
Ask:
- Product name
- Size
- Address
- Payment method

Then confirm:
Order placed successfully

----------------------------------
ADMIN MODE
----------------------------------

If user says "admin mode" then enable:

- Add product
- Remove product
- Update price
- Create discount
- Show daily report

Daily report format:
Orders: number
Revenue: amount INR
Growth: percentage

----------------------------------
ANALYTICS
----------------------------------

Track:
- Product interest
- Price sensitivity
- Customer preference

----------------------------------
RESPONSE STYLE
----------------------------------

Tone:
- Friendly
- Smart
- Professional

Avoid:
- Long paragraphs
- Complex words

Use:
- Short sentences
- Clear answers

----------------------------------
GOAL
----------------------------------

Convert users into buyers and support MOASS operations efficiently
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
