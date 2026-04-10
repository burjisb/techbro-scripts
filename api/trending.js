export default async function handler(req, res) {
  try {
    const key = process.env.GROQ_KEY;
    if (!key) return res.status(500).json({ error: "No API key found" });

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{
          role: "user",
          content: `Return a JSON array of exactly 12 trending AI/tech terms from 2025. For each include: term, category (one of: Protocol, Trend, Concept, Technique, Model, Tool, New, Security), heat (60-99). Return ONLY the JSON array, no markdown, no explanation. Example: [{"term":"MCP","category":"Protocol","heat":99}]`
        }],
        max_tokens: 500,
      }),
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const raw = data.choices?.[0]?.message?.content || "[]";
    const clean = raw.replace(/```json|```/g, "").trim();
    const terms = JSON.parse(clean);
    res.setHeader("Cache-Control", "s-maxage=86400");
    res.status(200).json(terms);

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}