import Cursor from "./components/Cursor";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import StatsStrip from "./components/StatsStrip";
import About from "./components/About";
import Membership from "./components/Membership";
import Trainers from "./components/Trainers";
import Schedule from "./components/Schedule";
import CTA from "./components/CTA";
import Footer from "./components/Footer";
import ScrollReveal from "./components/ScrollReveal";

export default function Home() {
  return (
    <>
      <Cursor />
      <ScrollReveal />
      <Navbar />
      <main>
        <Hero />
        <StatsStrip />
        <About />
        <Membership />
        <Trainers />
        <Schedule />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
