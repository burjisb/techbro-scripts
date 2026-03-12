import { useState, useEffect } from "react";

const TRENDING_TERMS = [
  { term: "MCP", category: "Protocol", heat: 99 },
  { term: "Vibe Coding", category: "Trend", heat: 95 },
  { term: "AI Agents", category: "Concept", heat: 92 },
  { term: "RAG", category: "Technique", heat: 88 },
  { term: "Claude Opus 4", category: "Model", heat: 85 },
  { term: "Cursor AI", category: "Tool", heat: 83 },
  { term: "Gemini 2.5", category: "Model", heat: 80 },
  { term: "OpenClaw", category: "New", heat: 78 },
  { term: "Multimodal AI", category: "Concept", heat: 75 },
  { term: "Llama 4", category: "Model", heat: 72 },
  { term: "Prompt Injection", category: "Security", heat: 68 },
  { term: "Fine-tuning", category: "Technique", heat: 65 },
];

const CATEGORY_COLORS = {
  Protocol: "#00ff88", Trend: "#ff6b35", Concept: "#4ecdc4",
  Technique: "#ffe66d", Model: "#a8edea", Tool: "#fd79a8",
  New: "#e17055", Security: "#ff4757",
};

const SYSTEM_PROMPT = `You are a casual, funny, and super clear tech explainer for YouTube Shorts and Instagram Reels. Your audience is 18-27 year olds who are curious about AI but not experts.

Your tone:
- Casual American English, like talking to a friend
- Use "bro", "honestly", "okay so", "here's the thing", "no cap", "lowkey", "it's actually insane"
- Use simple everyday analogies — like comparing AI to Netflix, Uber, or a group chat
- NEVER use jargon without explaining it immediately
- Keep it 30-60 seconds when read aloud (~80-110 words)
- Structure: Hook → What it is (simple analogy) → Why it matters → Closer
- Hook must be a question or a shocking statement that grabs attention in 1 second
- End with a punchy one-liner that makes people want to follow

Format your response as JSON only, exactly like this:
{
  "hook": "the opening line",
  "explanation": "the main explanation part",
  "why_it_matters": "why this is a big deal",
  "closer": "punchy ending line",
  "full_script": "the complete script as one flowing piece",
  "word_count": 95,
  "read_time": "45 sec"
}`;

export default function App() {
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [script, setScript] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [customTerm, setCustomTerm] = useState("");
  const [copied, setCopied] = useState(false);
  const [searchMode, setSearchMode] = useState("trending");
  const [researchData, setResearchData] = useState("");
  const [phase, setPhase] = useState("idle");
  const [trendingTerms, setTrendingTerms] = useState(TRENDING_TERMS);

  useEffect(() => {
    fetch("/api/trending")
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setTrendingTerms(data); })
      .catch(() => {});
  }, []);

  const categoryColor = (cat) => CATEGORY_COLORS[cat] || "#fff";

  async function callGemini(prompt, systemPrompt = "") {
    const key = import.meta.env.VITE_GEMINI_KEY;
    console.log("KEY:", key);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
    console.log("URL:", url);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(systemPrompt && { system_instruction: { parts: [{ text: systemPrompt }] } }),
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });
    const data = await res.json();
    console.log("RESPONSE:", JSON.stringify(data));
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }

  async function researchTerm(term) {
    setPhase("researching");
    const text = await callGemini(
      `What is "${term}" in the context of AI/tech in 2025-2026? Include: what it is, who made it, why people are excited about it, and one real-world use case. Keep it factual and concise, max 150 words.`
    );
    return text;
  }

  async function generateScript(term, research) {
    setPhase("scripting");
    const raw = await callGemini(
      `Write a 30-60 second YouTube Shorts/Reels script explaining "${term}" to a general audience aged 18-27.

Research context:
${research}

Remember: casual English, use "bro", simple analogies, no jargon dumps. JSON only.`,
      SYSTEM_PROMPT
    );
    try {
      const clean = raw.replace(/```json|```/g, "").trim();
      return JSON.parse(clean);
    } catch {
      return { full_script: raw, hook: "", explanation: "", why_it_matters: "", closer: "", word_count: 0, read_time: "~45 sec" };
    }
  }

  async function handleGenerate(term) {
    setSelectedTerm(term);
    setScript(null);
    setError(null);
    setLoading(true);
    setCopied(false);
    try {
      const research = await researchTerm(term);
      setResearchData(research);
      const result = await generateScript(term, research);
      setScript(result);
      setPhase("done");
    } catch (e) {
      setError("Something went wrong bro 😅 Try again?");
      setPhase("idle");
    } finally {
      setLoading(false);
    }
  }

  function handleCustomSubmit() {
    if (customTerm.trim()) handleGenerate(customTerm.trim());
  }

  function copyScript() {
    if (script?.full_script) {
      navigator.clipboard.writeText(script.full_script);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const phaseMessages = {
    researching: "🔍 Researching the term...",
    scripting: "✍️ Writing your script...",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", fontFamily: "'IBM Plex Mono', monospace", color: "#e8e8e0", padding: "0", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .term-chip { background: #111118; border: 1px solid #222; border-radius: 6px; padding: 10px 14px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .term-chip:hover { border-color: #444; background: #161620; transform: translateY(-1px); }
        .term-chip.active { border-color: #00ff88; background: #00ff8810; }
        .heat-bar { height: 3px; background: #1a1a2e; border-radius: 2px; overflow: hidden; width: 50px; }
        .heat-fill { height: 100%; border-radius: 2px; }
        .gen-btn { background: #00ff88; color: #0a0a0f; border: none; border-radius: 6px; padding: 12px 24px; font-family: 'IBM Plex Mono', monospace; font-weight: 600; font-size: 13px; cursor: pointer; transition: all 0.2s; letter-spacing: 0.05em; }
        .gen-btn:hover { background: #00e87a; transform: translateY(-1px); }
        .gen-btn:disabled { background: #1a1a1a; color: #444; cursor: not-allowed; transform: none; }
        .copy-btn { background: transparent; border: 1px solid #333; border-radius: 6px; padding: 8px 16px; color: #888; font-family: 'IBM Plex Mono', monospace; font-size: 12px; cursor: pointer; transition: all 0.2s; }
        .copy-btn:hover { border-color: #00ff88; color: #00ff88; }
        .copy-btn.copied { border-color: #00ff88; color: #00ff88; background: #00ff8815; }
        .custom-input { background: #111118; border: 1px solid #222; border-radius: 6px; padding: 12px 16px; color: #e8e8e0; font-family: 'IBM Plex Mono', monospace; font-size: 13px; width: 100%; transition: border-color 0.2s; }
        .custom-input:focus { outline: none; border-color: #00ff88; }
        .custom-input::placeholder { color: #444; }
        .script-block { background: #0e0e16; border: 1px solid #1e1e2e; border-radius: 8px; padding: 20px; margin-bottom: 12px; }
        .script-block-label { font-size: 10px; letter-spacing: 0.15em; color: #555; text-transform: uppercase; margin-bottom: 10px; }
        .script-block-text { font-size: 15px; line-height: 1.7; color: #d0d0c8; font-family: 'Syne', sans-serif; }
        .full-script { background: #0a0f0a; border: 1px solid #00ff8830; border-radius: 10px; padding: 24px; font-size: 16px; line-height: 1.8; color: #c8e8c8; font-family: 'Syne', sans-serif; font-weight: 700; white-space: pre-wrap; }
        .loading-pulse { animation: pulse 1.5s ease-in-out infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .badge { font-size: 9px; letter-spacing: 0.1em; padding: 2px 7px; border-radius: 3px; font-weight: 600; text-transform: uppercase; }
        .tab-btn { background: transparent; border: none; color: #555; font-family: 'IBM Plex Mono', monospace; font-size: 12px; letter-spacing: 0.08em; cursor: pointer; padding: 8px 0; border-bottom: 2px solid transparent; transition: all 0.2s; }
        .tab-btn.active { color: #00ff88; border-bottom-color: #00ff88; }
        .stat-chip { background: #111118; border: 1px solid #1e1e2e; border-radius: 5px; padding: 6px 12px; font-size: 11px; color: #666; display: inline-flex; align-items: center; gap: 6px; }
        .stat-val { color: #00ff88; font-weight: 600; }
      `}</style>

      <div style={{ borderBottom: "1px solid #111", padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#00ff88", boxShadow: "0 0 10px #00ff88" }} />
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "18px" }}>
            TechBro<span style={{ color: "#00ff88" }}>Script</span>
          </span>
          <span style={{ fontSize: "10px", color: "#444", letterSpacing: "0.15em", textTransform: "uppercase" }}>AI Script Generator</span>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <span className="stat-chip">🎬 Shorts / Reels</span>
          <span className="stat-chip">⏱ <span className="stat-val">30-60s</span></span>
        </div>
      </div>

      <div style={{ display: "flex", minHeight: "calc(100vh - 65px)" }}>
        <div style={{ width: 320, borderRight: "1px solid #111", padding: "24px 20px", flexShrink: 0, overflowY: "auto" }}>
          <div style={{ display: "flex", gap: "20px", marginBottom: "20px", borderBottom: "1px solid #111", paddingBottom: "2px" }}>
            <button className={`tab-btn ${searchMode === "trending" ? "active" : ""}`} onClick={() => setSearchMode("trending")}>TRENDING</button>
            <button className={`tab-btn ${searchMode === "custom" ? "active" : ""}`} onClick={() => setSearchMode("custom")}>CUSTOM</button>
          </div>

          {searchMode === "trending" && (
            <div>
              <p style={{ fontSize: "11px", color: "#444", marginBottom: "16px", lineHeight: 1.5 }}>Click any term → research + generate script</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {trendingTerms.map((item) => (
                  <div key={item.term} className={`term-chip ${selectedTerm === item.term ? "active" : ""}`} onClick={() => !loading && handleGenerate(item.term)}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span style={{ fontWeight: 600, fontSize: "13px" }}>{item.term}</span>
                      <span className="badge" style={{ background: categoryColor(item.category) + "20", color: categoryColor(item.category), width: "fit-content" }}>{item.category}</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                      <span style={{ fontSize: "11px", color: "#555" }}>{item.heat}°</span>
                      <div className="heat-bar"><div className="heat-fill" style={{ width: `${item.heat}%`, background: item.heat > 85 ? "#ff6b35" : item.heat > 70 ? "#ffe66d" : "#00ff88" }} /></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchMode === "custom" && (
            <div>
              <p style={{ fontSize: "11px", color: "#444", marginBottom: "16px", lineHeight: 1.5 }}>Type any AI/tech term you want a script for</p>
              <input className="custom-input" placeholder="e.g. OpenAI o3, Sora, Grok..." value={customTerm} onChange={e => setCustomTerm(e.target.value)} onKeyDown={e => e.key === "Enter" && handleCustomSubmit()} />
              <button className="gen-btn" style={{ width: "100%", marginTop: "12px" }} disabled={loading || !customTerm.trim()} onClick={handleCustomSubmit}>
                {loading ? "GENERATING..." : "→ GENERATE SCRIPT"}
              </button>
            </div>
          )}
        </div>

        <div style={{ flex: 1, padding: "32px 40px", overflowY: "auto" }}>
          {!selectedTerm && !loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "16px", opacity: 0.4 }}>
              <div style={{ fontSize: "48px" }}>🎬</div>
              <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "22px", textAlign: "center" }}>Pick a term, get a script</p>
              <p style={{ fontSize: "12px", color: "#555", textAlign: "center", maxWidth: 300, lineHeight: 1.6 }}>Select from trending terms or type your own. We research it, then write a banger script for your Shorts.</p>
            </div>
          )}

          {loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#00ff88", boxShadow: "0 0 10px #00ff88" }} className="loading-pulse" />
                <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "20px" }}>{selectedTerm}</span>
              </div>
              <div className="script-block loading-pulse">
                <div className="script-block-label">Status</div>
                <p style={{ fontSize: "14px", color: "#888" }}>{phaseMessages[phase] || "Starting up..."}</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {["Researching the term...", "Summarising context...", "Writing your script...", "Almost done..."].map((step, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: phase === "researching" && i < 2 ? "#00ff88" : phase === "scripting" && i >= 2 ? "#00ff88" : "#222" }} className="loading-pulse" />
                    <span style={{ fontSize: "12px", color: "#444" }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <div style={{ background: "#ff475715", border: "1px solid #ff4757", borderRadius: "8px", padding: "20px", color: "#ff4757" }}>{error}</div>}

          {script && !loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "20px" }}>
                <div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "26px" }}>
                    {selectedTerm}<span style={{ color: "#00ff88", marginLeft: 10 }}>✓</span>
                  </div>
                  <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
                    {script.word_count > 0 && <span className="stat-chip">📝 <span className="stat-val">{script.word_count}</span> words</span>}
                    {script.read_time && <span className="stat-chip">⏱ <span className="stat-val">{script.read_time}</span></span>}
                    <span className="stat-chip">🎬 <span className="stat-val">Shorts/Reels</span></span>
                  </div>
                </div>
                <button className={`copy-btn ${copied ? "copied" : ""}`} onClick={copyScript}>{copied ? "✓ COPIED" : "COPY SCRIPT"}</button>
              </div>

              <div>
                <div style={{ fontSize: "10px", color: "#444", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "10px" }}>Full Script</div>
                <div className="full-script">{script.full_script}</div>
              </div>

              {(script.hook || script.explanation || script.why_it_matters || script.closer) && (
                <div>
                  <div style={{ fontSize: "10px", color: "#444", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "12px" }}>Script Breakdown</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    {script.hook && <div className="script-block"><div className="script-block-label">🎣 Hook</div><div className="script-block-text">{script.hook}</div></div>}
                    {script.explanation && <div className="script-block"><div className="script-block-label">💡 Explanation</div><div className="script-block-text">{script.explanation}</div></div>}
                    {script.why_it_matters && <div className="script-block"><div className="script-block-label">🔥 Why It Matters</div><div className="script-block-text">{script.why_it_matters}</div></div>}
                    {script.closer && <div className="script-block" style={{ borderColor: "#00ff8830" }}><div className="script-block-label">⚡ Closer</div><div className="script-block-text" style={{ color: "#00ff88" }}>{script.closer}</div></div>}
                  </div>
                </div>
              )}

              {researchData && (
                <div>
                  <div style={{ fontSize: "10px", color: "#333", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "8px" }}>Research Context Used</div>
                  <div style={{ background: "#0a0a0f", border: "1px solid #111", borderRadius: "6px", padding: "16px", fontSize: "11px", color: "#444", lineHeight: 1.7, maxHeight: 150, overflowY: "auto" }}>{researchData}</div>
                </div>
              )}

              <button className="gen-btn" style={{ width: "fit-content" }} onClick={() => handleGenerate(selectedTerm)}>↺ REGENERATE SCRIPT</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}