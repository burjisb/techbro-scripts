export default async function handler(req, res) {
  try {
    const key = process.env.GEMINI_KEY;
    
    if (!key) {
      return res.status(500).json({ error: "No API key found" });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Return a JSON array of exactly 12 trending AI/tech terms from 2025. For each include: term, category (one of: Protocol, Trend, Concept, Technique, Model, Tool, New, Security), heat (60-99). Return ONLY the JSON array, no markdown.`
            }]
          }]
        })
      }
    );
    
    const data = await response.json();
    
    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    const clean = raw.replace(/```json|```/g, "").trim();
    const terms = JSON.parse(clean);
    res.setHeader("Cache-Control", "s-maxage=86400");
    res.status(200).json(terms);

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}