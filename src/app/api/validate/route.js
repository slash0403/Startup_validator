// Backend API route — runs only on the server.
// Called when page.js POSTs to /api/validate.
// Does three things in sequence: extract search query → fetch news → analyse with Groq.

// Sends a prompt to Groq and returns the parsed JSON response.
// Groq uses the OpenAI-compatible format: messages array + response_format for JSON mode.
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
      response_format: { type: "json_object" }, // tells Groq to always return valid JSON
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error("Groq API call failed: " + JSON.stringify(data));
  }

  // Groq (OpenAI-compatible) returns the text at choices[0].message.content
  const rawText = data.choices?.[0]?.message?.content;

  if (!rawText) {
    throw new Error("Groq returned an empty response");
  }

  return JSON.parse(rawText);
}

// Step 1: Ask Groq to turn the raw idea into a single focused search phrase.
// One precise phrase like "AI tutoring rural India" finds better news than
// multiple short keywords joined with OR.
async function extractSearchQuery(idea) {
  const prompt = `Generate a single focused search query for finding recent news articles about this startup idea. It should be one precise phrase of 3-5 words that captures the core market and technology.

Bad example: 'education OR AI OR India'
Good example: 'AI tutoring rural India'

Startup idea: "${idea}"

Return only a JSON object: { "query": "your search phrase here" }`;

  const result = await callGroq(prompt);
  return result.query;
}

// Step 2: Use the search query to fetch recent relevant articles from GNews.
// If the fetch fails, returns an empty array so the analysis can still run.
async function fetchNews(query) {
  const apiKey = process.env.GNEWS_API_KEY;
  const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&max=8&token=${apiKey}`;

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok || data.errors) {
    console.error("GNews error:", data.errors || response.status);
    return []; // return empty rather than crashing the whole request
  }

  // GNews returns source as an object { name }, so we extract the name
  return (data.articles || []).map((article) => ({
    title: article.title,
    url: article.url,
    source: article.source?.name || "Unknown",
    publishedAt: article.publishedAt,
    description: article.description,
  }));
}

// Step 3: Send the idea + search query + news to Groq for a full structured analysis.
// Returns a parsed JavaScript object with refinedIdea, comprehensiveReport, and metrics.
async function analyzeIdea(idea, searchQuery, articles) {
  // Format articles as readable text to include in the prompt
  const articlesText = articles
    .map(
      (a, i) =>
        `${i + 1}. "${a.title}" — ${a.description || "No description"} (${a.source})`
    )
    .join("\n");

  const prompt = `You are a startup market analyst. Analyse this startup idea using the provided search context and recent news.

Startup idea: "${idea}"
Market search query: ${searchQuery}

Recent news articles:
${articlesText || "No articles available."}

Return a JSON object with exactly these fields:
{
  "refinedIdea": "A polished one-paragraph version of the startup idea with stronger positioning and clarity",
  "comprehensiveReport": "A single plain text string — NOT a nested object or array. Use \\n\\n to separate the 8 sections. Each section must start with its label in capitals followed by a colon. Example format: MARKET OPPORTUNITY:\\n\\nYour analysis here...\\n\\nPROBLEM VALIDATION:\\n\\nYour analysis here... The 8 required sections are: MARKET OPPORTUNITY (size, growth rate, who needs this), PROBLEM VALIDATION (real painful problem or nice-to-have?), COMPETITION LANDSCAPE (who exists, their weakness, the gap), TARGET CUSTOMER (exact first customer, how to reach them), GO TO MARKET PATH (step by step first 100 users), WHAT TO BUILD FIRST (smallest MVP that proves the idea), KEY RISKS (top 3 risks and mitigations), VERDICT (honest overall assessment and the single most important thing to validate first). Each section minimum 2-3 sentences.",
  "metrics": {
    "confidenceScore": <integer 0-100, overall confidence this idea can succeed>,
    "marketTiming": <integer 0-100, how good the timing is right now — 100 means perfect time to build>,
    "timeToImplement": "<e.g. 6-12 months>",
    "competitionLevel": <integer 0-100, how saturated the market is — 100 means extremely competitive>,
    "marketSize": "<e.g. $4.2B>",
    "executionRisk": <integer 0-100, how risky execution is — 100 means extremely high risk>
  }
}

Return ONLY the JSON object. No markdown, no code fences, no extra text.`;

  return await callGroq(prompt);
}

// The main POST handler — orchestrates all three steps and returns the combined result
export async function POST(request) {
  try {
    const body = await request.json();
    const idea = body.idea?.trim();

    if (!idea) {
      return Response.json(
        { error: "No startup idea provided." },
        { status: 400 }
      );
    }

    // Run the steps in sequence
    const searchQuery = await extractSearchQuery(idea);
    const articles = await fetchNews(searchQuery);
    const analysis = await analyzeIdea(idea, searchQuery, articles);

    // Merge the analysis object with the articles and return everything
    return Response.json({ ...analysis, articles, searchQuery });
  } catch (err) {
    console.error("Validation error:", err.message);
    return Response.json(
      { error: "Analysis failed. Please try again." },
      { status: 500 }
    );
  }
}
