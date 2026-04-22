"use client";

import { useEffect, useState } from "react";

export default function CTA() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <section
      id="contact"
      style={{
        padding: isMobile ? "80px 24px" : "120px 60px",
        background: "var(--accent)",
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1fr auto",
        alignItems: "center",
        gap: isMobile ? 36 : 60,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* BG text — scale down on mobile */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          right: isMobile ? -20 : -40,
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: isMobile ? 120 : 300,
          color: "rgba(0,0,0,0.06)",
          pointerEvents: "none",
          lineHeight: 1,
          top: "50%",
          transform: "translateY(-50%)",
          userSelect: "none",
        }}
      >
        JOIN
      </span>

      <div className="reveal">
        <h2
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "clamp(48px, 6vw, 90px)",
            lineHeight: 0.95,
            color: "var(--black)",
            letterSpacing: 2,
          }}
        >
          READY TO<br />
          START YOUR<br />
          JOURNEY?
        </h2>
        <p
          style={{
            fontSize: isMobile ? 15 : 16,
            color: "rgba(0,0,0,0.6)",
            maxWidth: 480,
            lineHeight: 1.6,
            marginTop: 20,
            fontWeight: 300,
          }}
        >
          Join hundreds of members who have already transformed their lives at
          IronForge. Your first step starts today.
        </p>
      </div>

      <div className="reveal">
        
        <a  href="/join"
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 14,
            letterSpacing: 3,
            textTransform: "uppercase",
            fontWeight: 700,
            background: "var(--black)",
            color: "var(--accent)",
            padding: "20px 48px",
            transition: "all 0.2s",
            whiteSpace: "nowrap",
            textDecoration: "none",
            display: "block",
            textAlign: "center",
            width: isMobile ? "100%" : "auto",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#1a1a1a")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--black)")}
        >
          Join IronForge
        </a>
      </div>
    </section>
  );
}
