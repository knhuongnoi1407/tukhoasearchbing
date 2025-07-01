const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // Cho phép GitHub Pages truy cập

// ✅ Route mới để UptimeRobot ping Render mỗi 5 phút
app.get("/ping", (req, res) => {
  res.send("pong");
});

// Route chính lấy từ khóa
app.get("/keywords", async (req, res) => {
  try {
    const prompt = `
Tạo một danh sách 35 từ khóa tìm kiếm trên Bing bằng tiếng Việt, đầy đủ, chỉ tiếng Việt không tiếng Anh, không trùng, đúng chính tả, theo xu hướng.
    `;

    const API_URL =
      process.env.OPENAI_BASE_URL || "https://api.groq.com/openai/v1";

    const response = await fetch(`${API_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
      }),
    });

    const data = await response.json();
    console.log("Phản hồi từ Groq:", JSON.stringify(data, null, 2));

    if (!data.choices || !data.choices[0]?.message?.content) {
      return res.status(500).json({ error: "Không có phản hồi hợp lệ từ AI." });
    }

    const text = data.choices[0].message.content;
    const lines = text
      .split("\n")
      .map((line) => line.replace(/^\d+\.?\s*/, "").trim());

    if (
      lines[0]?.toLowerCase().includes("here are") ||
      lines[0]?.toLowerCase().includes("search keywords") ||
      lines[0]?.length > 60
    ) {
      lines.shift();
    }

    const keywords = lines.filter(
      (line) =>
        line &&
        !line.startsWith("**") &&
        !line.match(/^\*.*\*$/) &&
        line.length <= 60
    );

    res.json({ keywords });
  } catch (err) {
    console.error("Lỗi khi gọi AI:", err);
    res.status(500).json({ error: "Lỗi server khi gọi AI." });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server đang chạy tại http://localhost:${PORT}`);
});
