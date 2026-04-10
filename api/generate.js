export default async function handler(req, res) {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }
  
    try {
      const key = process.env.GEMINI_KEY;
      if (!key) return res.status(500).json({ error: "No API key found" });
  
      const { prompt, systemPrompt } = req.body;
  
      const body = {
        contents: [{ parts: [{ text: prompt }] }],
      };
  
      if (systemPrompt) {
        body.system_instruction = { parts: [{ text: systemPrompt }] };
      }
  
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
  
      const data = await response.json();
  
      if (data.error) {
        return res.status(429).json({ error: data.error.message });
      }
  
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      res.status(200).json({ text });
  
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }