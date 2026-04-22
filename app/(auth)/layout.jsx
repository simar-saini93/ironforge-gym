// Root layout (app/layout.jsx) already provides <html> and <body>
// This layout just scopes the auth section — no html/body needed here

export const metadata = {
  title:       'IronForge — Sign In',
  description: 'Sign in to IronForge Gym Management',
};

export default function AuthLayout({ children }) {
  return children;
}