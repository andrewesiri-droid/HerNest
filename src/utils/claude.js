export const claude = async (sys, prompt) => {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: sys,
      messages: [{ role: "user", content: prompt }]
    })
  });
  const data = await res.json();
  return data.content?.[0]?.text || "";
};
