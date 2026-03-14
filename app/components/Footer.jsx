"use client";

import { useEffect, useState } from "react";

const FOOTER_COLS = [
  {
    title: "Navigate",
    links: [
      { href: "#about", label: "About" },
      { href: "#membership", label: "Membership" },
      { href: "#trainers", label: "Trainers" },
      { href: "#schedule", label: "Schedule" },
    ],
  },
  {
    title: "Membership",
    links: [
      { href: "#", label: "Day Pass" },
      { href: "#", label: "Monthly" },
      { href: "#", label: "Yearly" },
      { href: "#", label: "Member Login" },
    ],
  },
  {
    title: "Contact",
    links: [
      { href: "#", label: "info@ironforge.com" },
      { href: "#", label: "+1 (555) 000-0000" },
      { href: "#", label: "123 Fitness Ave" },
      { href: "#", label: "Mon–Sun: 5AM–11PM" },
    ],
  },
];

export default function Footer() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 640);
      setIsTablet(window.innerWidth >= 640 && window.innerWidth < 1024);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const getColumns = () => {
    if (isMobile) return "1fr";
    if (isTablet) return "1fr 1fr";
    return "2fr 1fr 1fr 1fr";
  };

  return (
    <>
      <footer
        style={{
          padding: isMobile ? "48px 24px" : isTablet ? "60px 40px" : "60px",
          borderTop: "1px solid var(--border)",
          display: "grid",
          gridTemplateColumns: getColumns(),
          gap: isMobile ? 40 : isTablet ? 40 : 60,
          background: "var(--black)",
        }}
      >
        {/* Brand */}
        <div
          className="reveal"
          style={{
            // On tablet span full width so brand sits alone on top row
            gridColumn: isTablet ? "1 / -1" : "auto",
          }}
        >
          <div
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: isMobile ? 28 : 32,
              letterSpacing: 4,
              color: "var(--white)",
              marginBottom: 12,
            }}
          >
            IRON<span style={{ color: "var(--accent)" }}>FORGE</span>
          </div>
          <p
            style={{
              fontSize: 13,
              color: "var(--muted)",
              lineHeight: 1.6,
              maxWidth: isTablet ? "100%" : 260,
              fontWeight: 300,
            }}
          >
            Premium fitness facility built for those who refuse to settle. Forge
            your legacy, one rep at a time.
          </p>
        </div>

        {FOOTER_COLS.map((col) => (
          <div key={col.title} className="reveal">
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 11,
                letterSpacing: 3,
                textTransform: "uppercase",
                color: "var(--accent)",
                marginBottom: 20,
              }}
            >
              {col.title}
            </div>
            <ul
              style={{
                listStyle: "none",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                padding: 0,
              }}
            >
              {col.links.map((link) => (
                <li key={link.label}>
                  
                  <a  href={link.href}
                    style={{
                      fontSize: 13,
                      color: "var(--muted)",
                      textDecoration: "none",
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--white)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </footer>

      {/* Bottom bar */}
      <div
        style={{
          padding: isMobile ? "20px 24px" : "24px 60px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: "center",
          gap: isMobile ? 8 : 0,
          background: "var(--black)",
        }}
      >
        <p
          style={{
            fontSize: 11,
            color: "var(--muted)",
            fontFamily: "'Barlow Condensed', sans-serif",
            letterSpacing: 1,
            textTransform: "uppercase",
            textAlign: isMobile ? "center" : "left",
          }}
        >
          © 2024 IronForge Gym. All rights reserved.
        </p>
        <p
          style={{
            fontSize: 11,
            color: "var(--muted)",
            fontFamily: "'Barlow Condensed', sans-serif",
            letterSpacing: 1,
            textTransform: "uppercase",
            textAlign: isMobile ? "center" : "right",
          }}
        >
          Built with precision. Designed for champions.
        </p>
      </div>
    </>
  );
}
