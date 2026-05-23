import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Prowider Mini Lead Distribution System',
  description: 'Fair lead allocation and provider dashboard'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
