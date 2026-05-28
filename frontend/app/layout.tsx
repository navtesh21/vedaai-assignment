import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VedaAI — AI Assessment Creator',
  description: 'AI-powered assessment creator for teachers. Generate structured question papers instantly.',
  keywords: 'AI assessment, question paper generator, teacher tool, education AI',
  openGraph: {
    title: 'VedaAI — AI Assessment Creator',
    description: 'Generate structured question papers using AI in seconds.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📚</text></svg>" />
      </head>
      <body>{children}</body>
    </html>
  );
}
