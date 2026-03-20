// Follow-up chat API route — runs only on the server.
// Receives a question + the full validation report as context,
// sends it to Groq, and returns a plain text answer.

// Sends a prompt to Groq and returns the raw text response (not JSON).
// Same Groq setup as validate/route.js — same model, same auth header.
async function callGroq(prompt) {
  const apiKey = process.env.GROQ_API_KEY;
  const endpoint = "https://api.groq.com/openai/v1/chat/completions";

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      // No response_format here — we want plain prose, not JSON
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error("Groq API call failed: " + JSON.stringify(data));
  }

  return data.choices?.[0]?.message?.content;
}

// The main POST handler — builds a context-rich prompt and returns the AI's answer
export async function POST(request) {
  try {
    const body = await request.json();
    const { question, idea, refinedIdea, comprehensiveReport, metrics } = body;

    if (!question?.trim()) {
      return Response.json({ error: "No question provided." }, { status: 400 });
    }

    // Build a prompt that gives Groq the full validation report as context
    // so it can answer questions specifically about this idea
    const prompt = `You are a startup analyst assistant. A founder has received a validation report for their startup idea and is asking a follow-up question. Use the report below as your context — answer specifically based on it.

Original idea: "${idea}"

Refined idea: "${refinedIdea}"

Analysis report:
${comprehensiveReport}

Metrics:
- Confidence Score: ${metrics.confidenceScore}/100
- Market Timing: ${metrics.marketTiming}/100
- Competition Level: ${metrics.competitionLevel}/100
- Execution Risk: ${metrics.executionRisk}/100
- Time to Build: ${metrics.timeToImplement}
- Market Size: ${metrics.marketSize}

Follow-up question: "${question}"

Answer helpfully and concisely. Stay grounded in the report above.`;

    const answer = await callGroq(prompt);

    return Response.json({ answer });

  } catch (err) {
    console.error("Follow-up error:", err.message);
    return Response.json(
      { error: "Failed to answer. Please try again." },
      { status: 500 }
    );
  }
}
