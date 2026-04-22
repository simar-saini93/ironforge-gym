"use client";

import { useEffect, useState } from "react";

const STATS = [
  { num: "500+", label: "Active Members" },
  { num: "24", label: "Expert Trainers" },
  { num: "50+", label: "Weekly Classes" },
  { num: "6 YRS", label: "Established" },
];

export default function Hero() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <section
      style={{
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "var(--black)",
      }}
    >
      {/* BG PHOTO */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <img
          src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&q=80&auto=format&fit=crop"
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            filter: "grayscale(100%) contrast(1.1)",
            opacity: 0.25,
          }}
        />
      </div>

      {/* BG grid lines */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          opacity: 0.4,
          zIndex: 1,
        }}
      />

      {/* Watermark */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        <span
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "clamp(60px, 18vw, 260px)",
            color: "transparent",
            WebkitTextStroke: "1px rgba(232,255,0,0.06)",
            letterSpacing: isMobile ? 4 : 12,
            whiteSpace: "nowrap",
            userSelect: "none",
          }}
        >
          IRONFORGE
        </span>
      </div>

      {/* Rotating circles */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1,
          pointerEvents: "none",
        }}
      >
        {[isMobile ? 300 : 700, isMobile ? 220 : 520, isMobile ? 140 : 340].map((size, i) => (
          <div
            key={size}
            className={`circle-${i + 1}`}
            style={{
              width: size,
              height: size,
              border: `1px solid ${
                i === 2 ? "rgba(255,61,0,0.08)" : `rgba(232,255,0,${i === 0 ? 0.05 : 0.08})`
              }`,
              borderRadius: "50%",
              position: "absolute",
            }}
          />
        ))}
      </div>

      {/* Radial vignette */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse 70% 70% at 50% 50%, rgba(8,8,8,0.55) 0%, var(--black) 85%)",
          zIndex: 2,
          pointerEvents: "none",
        }}
      />

      {/* ── MAIN CONTENT ── */}
      <div
        style={{
          position: "relative",
          zIndex: 3,
          flex: 1,
          padding: isMobile ? "130px 24px 48px" : "160px 60px 60px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          justifyContent: "center",
        }}
      >
        {/* Tag */}
        <div
          className="anim-1"
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 11,
            letterSpacing: isMobile ? 2 : 5,
            textTransform: "uppercase",
            color: "var(--accent)",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          {!isMobile && (
            <span style={{ width: 48, height: 1, background: "var(--accent)", display: "block" }} />
          )}
          Est. 2018 — Premium Fitness Facility
          {!isMobile && (
            <span style={{ width: 48, height: 1, background: "var(--accent)", display: "block" }} />
          )}
        </div>

        {/* Headline */}
        <h1
          className="anim-2"
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "clamp(72px, 13vw, 180px)",
            lineHeight: 0.88,
            letterSpacing: isMobile ? 2 : 4,
            marginBottom: 0,
          }}
        >
          <span style={{ display: "block" }}>
            FORGE{" "}
            <span style={{ WebkitTextStroke: "2px var(--white)", color: "transparent" }}>
              YOUR
            </span>
          </span>
          <span style={{ display: "block", color: "var(--accent)" }}>LEGACY</span>
        </h1>

        {/* Divider */}
        <div
          className="anim-3"
          style={{
            display: "flex",
            alignItems: "center",
            gap: isMobile ? 10 : 24,
            margin: isMobile ? "24px 0" : "40px 0",
            width: "100%",
            maxWidth: 640,
          }}
        >
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 10,
              letterSpacing: isMobile ? 2 : 4,
              textTransform: "uppercase",
              color: "var(--muted)",
              whiteSpace: "nowrap",
            }}
          >
            Transform · Elevate · Dominate
          </span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        {/* Sub copy */}
        <p
          className="anim-3"
          style={{
            fontSize: isMobile ? 15 : 17,
            lineHeight: 1.7,
            color: "var(--mid)",
            maxWidth: 520,
            marginBottom: isMobile ? 32 : 52,
            fontWeight: 300,
          }}
        >
          State-of-the-art equipment, science-backed programming, and an elite
          trainer team — built for those who refuse to settle.
        </p>

        {/* CTAs */}
        <div
          className="anim-4"
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: 12,
            alignItems: "center",
            width: isMobile ? "100%" : "auto",
            maxWidth: isMobile ? 340 : "none",
          }}
        >
          <a
            href="#membership"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 14,
              letterSpacing: 3,
              textTransform: "uppercase",
              fontWeight: 700,
              background: "var(--accent)",
              color: "var(--black)",
              padding: "18px 48px",
              transition: "all 0.2s",
              textDecoration: "none",
              display: "block",
              width: isMobile ? "100%" : "auto",
              textAlign: "center",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--white)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--accent)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Start Today
          </a>
          <a
            href="#about"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 14,
              letterSpacing: 3,
              textTransform: "uppercase",
              fontWeight: 700,
              background: "transparent",
              color: "var(--white)",
              padding: "17px 48px",
              border: "1px solid var(--border)",
              transition: "all 0.2s",
              textDecoration: "none",
              display: "block",
              width: isMobile ? "100%" : "auto",
              textAlign: "center",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.color = "var(--accent)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.color = "var(--white)";
            }}
          >
            Learn More
          </a>
        </div>

        {/* Scroll indicator — desktop only */}
        {!isMobile && (
          <div
            className="anim-4"
            style={{
              marginTop: 64,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 10,
                letterSpacing: 4,
                textTransform: "uppercase",
                color: "var(--muted)",
              }}
            >
              Scroll
            </span>
            <div
              style={{
                width: 1,
                height: 48,
                background: "linear-gradient(to bottom, var(--accent), transparent)",
              }}
            />
          </div>
        )}
      </div>

      {/* ── STATS BAR — in normal flow, NOT absolute ── */}
      
    </section>
  );
}
