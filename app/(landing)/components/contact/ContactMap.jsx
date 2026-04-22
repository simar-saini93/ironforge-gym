export default function ContactMap() {
  return (
    <div
      style={{
        padding: "0 60px 100px",
        background: "var(--black)",
      }}
    >
      <div
        style={{
          border: "1px solid var(--border)",
          overflow: "hidden",
          position: "relative",
          height: 360,
          background: "var(--card)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Decorative map placeholder */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            opacity: 0.5,
          }}
        />
        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              background: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
            }}
          >
            📍
          </div>
          <div
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 28,
              letterSpacing: 3,
              color: "var(--white)",
            }}
          >
            123 FITNESS AVENUE, NEW YORK
          </div>
          <a
            href="https://maps.google.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 12,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: "var(--accent)",
              textDecoration: "none",
              borderBottom: "1px solid var(--accent)",
              paddingBottom: 2,
            }}
          >
            Open in Google Maps →
          </a>
        </div>
      </div>
    </div>
  );
}