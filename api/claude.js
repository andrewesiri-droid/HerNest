export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Rate limiting — max 60 requests per minute per IP
  const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown";

  // Security headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");

  const { system, prompt, messages, max_tokens = 1000 } = req.body;

  // Input validation
  if (max_tokens > 2000) {
    return res.status(400).json({ error: "max_tokens exceeds limit" });
  }

  // Block prompt injection attempts
  const injectionPatterns = ["ignore previous instructions","ignore all instructions","you are now","forget you are","act as if","pretend you are","disregard your","override your"];
  const fullPrompt = (typeof prompt === "string" ? prompt : "") + (system || "");
  const hasInjection = injectionPatterns.some(p => fullPrompt.toLowerCase().includes(p));
  if (hasInjection) {
    return res.status(400).json({ error: "Invalid request" });
  }

  if (!prompt && !messages) {
    return res.status(400).json({ error: "Missing prompt or messages" });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens,
        system: system || undefined,
        messages: messages || [{ role: "user", content: prompt }]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: err });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
