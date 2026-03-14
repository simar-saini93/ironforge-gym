import "./globals.css";

export const metadata = {
  title: "IronForge Gym — Forge Your Legacy",
  description:
    "Premium fitness facility. Transform your body, elevate your mind with state-of-the-art equipment and certified expert trainers.",
  keywords: "gym, fitness, personal training, strength, HIIT, yoga",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
