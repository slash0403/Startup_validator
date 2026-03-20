'use client';

import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

// The four available color schemes.
// Selecting one sets data-scheme on <html>, which triggers CSS variable overrides
// defined in globals.css to recolor every Tailwind blue element on the page.
const SCHEMES = [
  { id: 'blue',   color: '#3b82f6', label: 'Blue'   },
  { id: 'purple', color: '#9333ea', label: 'Purple' },
  { id: 'green',  color: '#16a34a', label: 'Green'  },
  { id: 'orange', color: '#ea580c', label: 'Orange' },
];

// Fixed bottom-left panel with a dark/light toggle and a color scheme picker.
// We defer rendering until after mount to avoid a hydration mismatch —
// next-themes sets the theme class on <html> in the browser, not the server.
export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [scheme, setScheme] = useState('blue');

  // After mounting: read saved scheme from localStorage and apply it
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('color-scheme') || 'blue';
    setScheme(saved);
    document.documentElement.setAttribute('data-scheme', saved);
  }, []);

  // Toggles between dark and light mode
  function toggleTheme() {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }

  // Saves the chosen scheme to localStorage and applies it to <html>
  function selectScheme(id) {
    setScheme(id);
    localStorage.setItem('color-scheme', id);
    document.documentElement.setAttribute('data-scheme', id);
  }

  // Don't render on the server to avoid hydration mismatch
  if (!mounted) return null;

  const isDark = resolvedTheme === 'dark';

  return (
    <div className="fixed bottom-24 left-4 z-50 flex flex-col items-center gap-2">

      {/* Sun / Moon icon — toggles dark and light mode */}
      <button
        onClick={toggleTheme}
        className="w-10 h-10 bg-gray-900 border border-gray-700 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
        aria-label="Toggle dark/light mode"
      >
        {isDark ? (
          // Sun icon — shown in dark mode to indicate "switch to light"
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          // Moon icon — shown in light mode to indicate "switch to dark"
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </button>

      {/* Color scheme dot picker */}
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-2 flex flex-col gap-2">
        {SCHEMES.map((s) => (
          <button
            key={s.id}
            onClick={() => selectScheme(s.id)}
            aria-label={`${s.label} color scheme`}
            className="w-6 h-6 rounded-full transition-transform hover:scale-110"
            style={{
              backgroundColor: s.color,
              // Outline ring shows which scheme is active
              outline: scheme === s.id ? `2px solid ${s.color}` : 'none',
              outlineOffset: '2px',
            }}
          />
        ))}
      </div>

    </div>
  );
}
