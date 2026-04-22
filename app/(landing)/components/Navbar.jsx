"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "/",            label: "Home" },
  { href: "/#about",      label: "About" },
  { href: "/#membership", label: "Membership" },
  { href: "/#trainers",   label: "Trainers" },
  { href: "/#schedule",   label: "Schedule" },
  { href: "/contact",     label: "Contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const [isMobile, setIsMobile]   = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <>
      <nav
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0,
          zIndex: 100,
          padding: scrolled
            ? `14px ${isMobile ? "20px" : "60px"}`
            : `20px ${isMobile ? "20px" : "60px"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${scrolled ? "var(--border)" : "transparent"}`,
          background: scrolled
            ? "rgba(8,8,8,0.97)"
            : "linear-gradient(to bottom, rgba(8,8,8,0.95), transparent)",
          transition: "all 0.4s ease",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 28,
            letterSpacing: 4,
            color: "var(--white)",
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          IRON<span style={{ color: "var(--accent)" }}>FORGE</span>
        </Link>

        {/* Desktop links */}
        {!isMobile && (
          <ul style={{ display: "flex", gap: 40, listStyle: "none", margin: 0, padding: 0 }}>
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: 13,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    color: "var(--mid)",
                    textDecoration: "none",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--mid)")}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* Desktop CTA */}
        {!isMobile && (
          <Link
            href="/join"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 13,
              letterSpacing: 2,
              textTransform: "uppercase",
              background: "var(--accent)",
              color: "var(--black)",
              padding: "10px 24px",
              fontWeight: 700,
              transition: "all 0.2s",
              textDecoration: "none",
              display: "inline-block",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--white)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--accent)")}
          >
            Join Now
          </Link>
        )}

        {/* Mobile hamburger */}
        {isMobile && (
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              color: "var(--white)",
              width: 42,
              height: 42,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "border-color 0.2s",
              flexShrink: 0,
              padding: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={20} color="var(--white)" /> : <Menu size={20} color="var(--white)" />}
          </button>
        )}
      </nav>

      {/* Mobile drawer */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 99,
          background: "rgba(8,8,8,0.98)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 4,
          opacity: menuOpen ? 1 : 0,
          pointerEvents: menuOpen ? "auto" : "none",
          transition: "opacity 0.3s ease",
        }}
      >
        {NAV_LINKS.map((link, i) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setMenuOpen(false)}
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 52,
              letterSpacing: 4,
              color: "var(--white)",
              textDecoration: "none",
              lineHeight: 1.2,
              transition: `color 0.2s, opacity 0.3s ease ${i * 60}ms, transform 0.3s ease ${i * 60}ms`,
              opacity: menuOpen ? 1 : 0,
              transform: menuOpen ? "translateY(0)" : "translateY(20px)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--white)")}
          >
            {link.label}
          </Link>
        ))}

        <Link
          href="/join"
          onClick={() => setMenuOpen(false)}
          style={{
            marginTop: 32,
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 15,
            letterSpacing: 3,
            textTransform: "uppercase",
            fontWeight: 700,
            background: "var(--accent)",
            color: "var(--black)",
            padding: "16px 48px",
            textDecoration: "none",
            display: "inline-block",
            transition: `background 0.2s, opacity 0.3s ease ${NAV_LINKS.length * 60}ms, transform 0.3s ease ${NAV_LINKS.length * 60}ms`,
            opacity: menuOpen ? 1 : 0,
            transform: menuOpen ? "translateY(0)" : "translateY(20px)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--white)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--accent)")}
        >
          Join Now
        </Link>
      </div>
    </>
  );
}
