'use client';

// ThemeProvider must be a client component because it uses React context.
// We wrap it here so layout.js (a server component) can import it cleanly.
import { ThemeProvider } from 'next-themes';

export default function Providers({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      {children}
    </ThemeProvider>
  );
}
