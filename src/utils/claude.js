export const claude = async (sys, prompt, hist = []) => {
  try {
    const res = await fetch("/api/claude", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system: sys,
        prompt: prompt,
        max_tokens: 1000
      })
    });
    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    return data.content?.[0]?.text || "";
  } catch (e) {
    console.log("Claude error:", e);
    return "";
  }
};

// For vision calls (receipt scanning, school calendar photos)
export const claudeVision = async (base64, mediaType, prompt) => {
  try {
    const res = await fetch("/api/claude", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
            { type: "text", text: prompt }
          ]
        }],
        max_tokens: 1000
      })
    });
    if (!res.ok) throw new Error("Vision API error");
    const data = await res.json();
    return data.content?.[0]?.text || "";
  } catch (e) {
    console.log("Vision error:", e);
    return "";
  }
};
