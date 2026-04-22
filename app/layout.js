import { Outfit, DM_Sans, DM_Mono, Bebas_Neue, Barlow, Barlow_Condensed } from 'next/font/google';
import './globals.css';

// ── Admin / Trainer / Member portal fonts ──────────────────
const outfit = Outfit({
  subsets:  ['latin'],
  variable: '--font-outfit',
  display:  'swap',
});

const dmSans = DM_Sans({
  subsets:  ['latin'],
  variable: '--font-dm-sans',
  display:  'swap',
});

const dmMono = DM_Mono({
  weight:   ['400', '500'],
  subsets:  ['latin'],
  variable: '--font-dm-mono',
  display:  'swap',
});

// ── Landing page + auth fonts ──────────────────────────────
const bebasNeue = Bebas_Neue({
  weight:   ['400'],
  subsets:  ['latin'],
  variable: '--font-bebas',
  display:  'swap',
});

const barlow = Barlow({
  weight: ['300', '400', '600', '700'],
  style:  ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-barlow',
  display:  'swap',
});

const barlowCondensed = Barlow_Condensed({
  weight:  ['400', '700', '900'],
  subsets: ['latin'],
  variable: '--font-barlow-condensed',
  display:  'swap',
});

export const metadata = {
  title:       'IronForge Gym',
  description: 'IronForge Gym Management System',
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={[
        outfit.variable,
        dmSans.variable,
        dmMono.variable,
        bebasNeue.variable,
        barlow.variable,
        barlowCondensed.variable,
      ].join(' ')}
    >
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
