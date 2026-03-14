import Cursor from "../components/Cursor";
import Navbar from "../components/Navbar";
import ScrollReveal from "../components/ScrollReveal";
import JoinHero from "../components/join/JoinHero";
import JoinForm from "../components/join/JoinForm";
import Footer from "../components/Footer";

export const metadata = {
  title: "Join IronForge — Start Your Journey",
  description: "Become a member of IronForge Gym. Choose your plan and start your fitness journey today.",
};

export default function JoinPage() {
  return (
    <>
      <Cursor />
      <ScrollReveal />
      <Navbar />
      <main>
        <JoinHero />
        <JoinForm />
      </main>
      <Footer />
    </>
  );
}