"use client";

export default function ContactHero() {
  return (
    <section
      style={{
        minHeight: "40vh",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "flex-end",
        paddingBottom: 80,
        background: "var(--black)",
        paddingTop: 140,
      }}
    >
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <img
          src="https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1920&q=80&auto=format&fit=crop"
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            filter: "grayscale(100%) contrast(1.1)",
            opacity: 0.08,
          }}
        />
      </div>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          opacity: 0.3,
          zIndex: 1,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0, left: 0, right: 0,
          height: 160,
          background: "linear-gradient(to bottom, transparent, var(--black))",
          zIndex: 2,
        }}
      />
      <div style={{ position: "relative", zIndex: 3, padding: "0 60px", width: "100%" }}>
        <div
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 11,
            letterSpacing: 5,
            textTransform: "uppercase",
            color: "var(--accent)",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={{ width: 30, height: 1, background: "var(--accent)", display: "block" }} />
          Get In Touch
        </div>
        <h1
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "clamp(60px, 9vw, 120px)",
            lineHeight: 0.9,
            letterSpacing: 3,
          }}
        >
          CONTACT
          <br />
          <span style={{ WebkitTextStroke: "2px var(--white)", color: "transparent" }}>US</span>
        </h1>
      </div>
    </section>
  );
}