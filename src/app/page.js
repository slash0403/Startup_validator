'use client';

import { useState, useEffect, useRef } from 'react';

// Draws a circular progress ring using SVG.
// value: 0-100. color: the hex color of the filled arc.
// The math: circumference = 2πr. strokeDashoffset controls how much of the ring is "empty".
function CircularProgress({ value, color }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius; // total length of the circle path
  const offset = circumference - (value / 100) * circumference; // how much to leave unfilled

  return (
    <div className="relative w-22 h-22 flex items-center justify-center">
      {/* -rotate-90 makes the arc start from the top instead of the right */}
      <svg width="88" height="88" className="absolute -rotate-90">
        {/* Background track */}
        <circle cx="44" cy="44" r={radius} fill="none" stroke="#1f2937" strokeWidth="8" />
        {/* Filled arc */}
        <circle
          cx="44" cy="44"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      {/* Value label sits on top of the SVG */}
      <span className="text-lg font-bold text-white z-10">{value}</span>
    </div>
  );
}

// A card for a single metric.
// isScore=true shows a circular ring. isScore=false shows a plain text value.
// explanation is a one-line description shown in small italic text beneath the label.
function MetricCard({ label, explanation, value, isScore, color }) {
  return (
    <div className="py-6 border-b border-gray-800 last:border-b-0">
      <p className="text-white font-semibold text-sm mb-1">{label}</p>
      <p className="text-gray-500 text-xs italic mb-4 leading-relaxed">{explanation}</p>
      {isScore ? (
        <CircularProgress value={value} color={color} />
      ) : (
        <span className="text-3xl font-bold text-white">{value}</span>
      )}
    </div>
  );
}

// Formats an ISO date string (e.g. "2026-03-18T10:00:00Z") into "Mar 18, 2026"
function formatDate(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// A single news article card — editorial newspaper style with a left accent border.
function NewsCard({ article }) {
  return (
    <div className="border-b border-gray-800 last:border-b-0 pb-7 mb-7 last:pb-0 last:mb-0">
      {/* Left accent line + content */}
      <div className="border-l-2 border-blue-600 pl-4">
        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">
          {article.source}
        </p>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-100 font-bold text-base leading-snug hover:underline decoration-gray-500 block mb-2"
        >
          {article.title}
        </a>
        <p className="text-gray-600 text-xs mb-3">{formatDate(article.publishedAt)}</p>
        {article.description && (
          <p className="text-gray-400 text-sm leading-relaxed">{article.description}</p>
        )}
      </div>
    </div>
  );
}

// The three-step loading screen.
// step: 0 = extracting keywords, 1 = fetching news, 2 = running analysis
// Each step shows as active (blue) while running and done (green) when passed
function LoadingScreen({ step }) {
  const steps = [
    'Extracting keywords from your idea...',
    'Searching for relevant news...',
    'Analysing market and generating report...',
  ];

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <h2 className="text-white text-2xl font-semibold text-center mb-10">
          Analysing your idea
        </h2>
        <div className="space-y-6">
          {steps.map((label, index) => {
            const isDone = step > index;
            const isActive = step === index;

            return (
              <div key={index} className="flex items-center gap-4">
                {/* Circle indicator: green checkmark if done, pulsing if active, grey if upcoming */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors duration-500 ${
                  isDone ? 'bg-green-500' : isActive ? 'bg-blue-500' : 'bg-gray-800'
                }`}>
                  {isDone ? (
                    // Checkmark SVG
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-white animate-pulse' : 'bg-gray-600'}`} />
                  )}
                </div>

                <span className={`text-base transition-colors duration-500 ${
                  isDone ? 'text-green-400' : isActive ? 'text-white' : 'text-gray-600'
                }`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// The main page component — manages which view is shown and all shared state
export default function Home() {
  // idea: what the user typed in the input bar
  // view: which screen to show — 'landing', 'loading', or 'results'
  // loadingStep: which of the 3 loading steps is currently active (0, 1, or 2)
  // report: the full JSON object returned by the API
  // error: a string shown to the user if something goes wrong
  // messages: array of { role: 'user' | 'ai', text: '...' } for the follow-up chat
  // followupInput: what the user is typing in the follow-up bar
  // followupLoading: true while waiting for an AI answer to the follow-up
  const [idea, setIdea] = useState('');
  const [view, setView] = useState('landing');
  const [loadingStep, setLoadingStep] = useState(0);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([]);
  const [followupInput, setFollowupInput] = useState('');
  const [followupLoading, setFollowupLoading] = useState(false);

  // Ref attached to an invisible div at the bottom of the chat thread.
  // We scroll it into view whenever a new message is added.
  const messagesEndRef = useRef(null);

  // Advances the loading step indicator on a timer while we wait for the API.
  // useEffect runs whenever `view` changes. We use timers to simulate step progress
  // because the actual steps happen server-side and we can't track them from the browser.
  useEffect(() => {
    if (view !== 'loading') return;

    const t1 = setTimeout(() => setLoadingStep(1), 3500);
    const t2 = setTimeout(() => setLoadingStep(2), 7500);

    // Cleanup: cancel timers if the component re-renders before they fire
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [view]);

  // Called when the user submits the form.
  // Switches to loading view, calls the API, then switches to results view.
  async function handleSubmit(e) {
    e.preventDefault(); // prevents the browser's default form submit (page refresh)

    if (!idea.trim()) return;

    setView('loading');
    setLoadingStep(0);
    setError('');
    setReport(null);

    try {
      const response = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        setView('landing');
        return;
      }

      setReport(data);
      setView('results');

    } catch (err) {
      setError('Network error — could not reach the server. Please try again.');
      setView('landing');
    }
  }

  // Scrolls the chat thread to the bottom whenever a new message is added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Sends a follow-up question to /api/followup along with the full report context.
  // Adds the user message immediately, then adds the AI answer when it arrives.
  async function handleFollowup() {
    if (!followupInput.trim() || followupLoading) return;

    const question = followupInput.trim();
    setFollowupInput('');
    setFollowupLoading(true);

    // Show the user's question in the thread right away
    setMessages((prev) => [...prev, { role: 'user', text: question }]);

    try {
      const response = await fetch('/api/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          idea,
          refinedIdea: report.refinedIdea,
          comprehensiveReport: report.comprehensiveReport,
          metrics: report.metrics,
        }),
      });

      const data = await response.json();
      const answer = response.ok ? data.answer : (data.error || 'Something went wrong.');
      setMessages((prev) => [...prev, { role: 'ai', text: answer }]);

    } catch (err) {
      setMessages((prev) => [...prev, { role: 'ai', text: 'Network error. Please try again.' }]);
    } finally {
      setFollowupLoading(false);
    }
  }

  // Resets all state and sends the user back to the landing input screen
  function handleReset() {
    setIdea('');
    setReport(null);
    setError('');
    setLoadingStep(0);
    setMessages([]);
    setFollowupInput('');
    setFollowupLoading(false);
    setView('landing');
  }

  // ─── LOADING VIEW ───────────────────────────────────────────────────────────
  if (view === 'loading') {
    return <LoadingScreen step={loadingStep} />;
  }

  // ─── RESULTS VIEW ───────────────────────────────────────────────────────────
  if (view === 'results' && report) {
    const { metrics, refinedIdea, comprehensiveReport, articles } = report;

    return (
      <div className="min-h-screen bg-gray-950 text-white">

        {/* Slim header — original idea truncated + reset button */}
        <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-end">
          <button
            onClick={handleReset}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Validate Another Idea
          </button>
        </header>

        {/* Fixed follow-up chat bar pinned to the bottom of the screen */}
        <div className="fixed bottom-0 left-0 right-0 bg-gray-950 border-t border-gray-800 z-50">

          {/* Chat thread — only visible once the user has asked at least one question */}
          {messages.length > 0 && (
            <div className="max-h-75 overflow-y-auto px-6 pt-4 pb-2 space-y-3">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-200'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {/* Invisible div at the bottom — scrolled into view when messages update */}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Input row */}
          <div className="px-6 py-4 flex items-center gap-3">
            <input
              type="text"
              className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm outline-none focus:border-gray-500 transition-colors"
              placeholder="Ask a follow-up question about your idea..."
              value={followupInput}
              onChange={(e) => setFollowupInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleFollowup();
                }
              }}
              disabled={followupLoading}
            />
            <button
              onClick={handleFollowup}
              disabled={followupLoading || !followupInput.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-600 text-white p-3 rounded-xl transition-colors shrink-0"
              aria-label="Send follow-up question"
            >
              {followupLoading ? (
                <span className="w-5 h-5 flex items-center justify-center text-xs">•••</span>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Extra bottom padding so page content doesn't hide behind the fixed chat bar */}
        <main className="px-8 pb-40">

          {/* ── HERO ── */}
          <section className="py-20 text-center border-b border-gray-800">
            <p className="text-gray-600 text-xs font-semibold uppercase tracking-widest mb-5">
              Your Idea
            </p>
            <h1 className="text-5xl font-black text-white leading-tight max-w-3xl mx-auto uppercase">
              {idea}
            </h1>
          </section>

          {/* ── THREE COLUMNS ── */}
          {/* grid-cols-[1fr_2fr_1fr] gives left=25%, centre=50%, right=25% */}
          {/* items-start means each column is only as tall as its own content */}
          <div className="mt-12 grid grid-cols-1 lg:grid-cols-[1fr_2fr_1fr] gap-10 items-start">

            {/* LEFT — News Articles */}
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-8">
                Recent News
              </p>
              {articles && articles.length > 0 ? (
                articles.map((article, index) => (
                  <NewsCard key={index} article={article} />
                ))
              ) : (
                <p className="text-gray-600 text-sm">No news articles found for this topic.</p>
              )}
            </div>

            {/* CENTRE — Refined Idea + Analysis */}
            <div className="space-y-12">
              <div>
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-6">
                  Refined Idea
                </p>
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
                  <p className="text-gray-200 text-lg leading-relaxed">{refinedIdea}</p>
                </div>
              </div>

              <div>
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-6">
                  Analysis Report
                </p>
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
                  {/* Split on \n\n so each section and paragraph renders as its own <p> */}
                  <div className="text-gray-300 text-base leading-8">
                    {comprehensiveReport.split('\n\n').map((paragraph, index) => (
                      <p key={index} className="mb-4 last:mb-0">{paragraph}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT — Metrics */}
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-2">
                Metrics
              </p>
              <MetricCard
                label="Confidence Score"
                explanation="How likely this idea is to succeed in the current market"
                value={metrics.confidenceScore}
                isScore color="#3b82f6"
              />
              <MetricCard
                label="Market Timing"
                explanation="Is right now a good time to build this? 100 = perfect timing"
                value={metrics.marketTiming}
                isScore color="#10b981"
              />
              <MetricCard
                label="Competition Level"
                explanation="How crowded this market is. Lower is better for a new entrant"
                value={metrics.competitionLevel}
                isScore color="#f97316"
              />
              <MetricCard
                label="Execution Risk"
                explanation="How difficult this will be to actually build and ship"
                value={metrics.executionRisk}
                isScore color="#ef4444"
              />
              <MetricCard
                label="Time to Build"
                explanation="Estimated time from idea to a working product in market"
                value={metrics.timeToImplement}
                isScore={false}
              />
              <MetricCard
                label="Market Size"
                explanation="Total addressable market — the size of the opportunity"
                value={metrics.marketSize}
                isScore={false}
              />
            </div>

          </div>

        </main>
      </div>
    );
  }

  // ─── LANDING VIEW ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-6">
      <div className="w-full max-w-2xl">

        <h1 className="text-gray-400 text-center text-xl font-normal mb-6">
          Let us help you expand on your idea
        </h1>

        <form onSubmit={handleSubmit}>
          {/* Input bar — styled to look like ChatGPT's input */}
          <div className="flex items-center bg-gray-900 border border-gray-700 rounded-2xl px-5 py-4 gap-4 focus-within:border-gray-500 transition-colors">
            <textarea
              rows={2}
              className="flex-1 bg-transparent text-white placeholder-gray-500 text-base outline-none resize-none leading-relaxed"
              placeholder="Describe your idea and we'll gather everything for you"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              onKeyDown={(e) => {
                // Submit on Enter (without Shift), like ChatGPT
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            {/* Arrow send button */}
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl transition-colors shrink-0"
              aria-label="Submit idea"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </form>

        {/* Error shown below the input bar if something went wrong */}
        {error && (
          <p className="text-red-400 text-sm text-center mt-4">{error}</p>
        )}

      </div>
    </div>
  );
}
