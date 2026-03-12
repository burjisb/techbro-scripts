export default async function handler(req, res) {
    const key = process.env.GEMINI_KEY;
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a tech trend tracker. Return a JSON array of exactly 12 trending AI/tech terms from the last 7 days. 
              
  For each term include:
  - term: the name
  - category: one of Protocol, Trend, Concept, Technique, Model, Tool, New, Security
  - heat: a number from 60-99 based on how trending it is
  
  Return ONLY a JSON array, no markdown, no explanation. Example:
  [{"term":"MCP","category":"Protocol","heat":99}]`
            }]
          }]
        })
      }
    );
    
    const data = await response.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    
    try {
      const clean = raw.replace(/```json|```/g, "").trim();
      const terms = JSON.parse(clean);
      res.setHeader("Cache-Control", "s-maxage=86400");
      res.status(200).json(terms);
    } catch {
      res.status(500).json({ error: "Failed to parse terms" });
    }
  }