import Cursor from "../components/Cursor";
import Navbar from "../components/Navbar";
import ScrollReveal from "../components/ScrollReveal";
import ContactHero from "../components/contact/ContactHero";
import ContactForm from "../components/contact/ContactForm";
import ContactMap from "../components/contact/ContactMap";
import Footer from "../components/Footer";

export const metadata = {
  title: "Contact — IronForge Gym",
  description: "Get in touch with the IronForge team. We are here to help with memberships, training, and more.",
};

export default function ContactPage() {
  return (
    <>
      <Cursor />
      <ScrollReveal />
      <Navbar />
      <main>
        <ContactHero />
        <ContactForm />
        <ContactMap />
      </main>
      <Footer />
    </>
  );
}