"use client";

import { useEffect, useState } from "react";
import { MapPin, Phone, Mail, Clock, Send, CheckCircle } from "lucide-react";

const INFO_ITEMS = [
  {
    icon: MapPin,
    title: "Address",
    lines: ["123 Fitness Avenue", "New York, NY 10001"],
  },
  {
    icon: Phone,
    title: "Phone",
    lines: ["+1 (555) 000-0000", "Mon–Sun, 5AM – 11PM"],
  },
  {
    icon: Mail,
    title: "Email",
    lines: ["info@ironforge.com", "support@ironforge.com"],
  },
  {
    icon: Clock,
    title: "Hours",
    lines: ["Mon – Fri: 5:00 AM – 11:00 PM", "Sat – Sun: 7:00 AM – 9:00 PM"],
  },
];

export default function ContactForm() {
  const [focused, setFocused] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", subject: "", message: "",
  });

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = (e) => { e.preventDefault(); setSubmitted(true); };
  const getBorder = (field) => focused === field ? "var(--accent)" : "var(--border)";

  const inputStyle = {
    width: "100%",
    background: "var(--card)",
    border: "1px solid var(--border)",
    color: "var(--white)",
    padding: isMobile ? "14px 16px" : "16px 20px",
    fontFamily: "'Barlow', sans-serif",
    fontSize: 15,
    outline: "none",
    transition: "border-color 0.2s",
  };

  const labelStyle = {
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: 11,
    letterSpacing: 3,
    textTransform: "uppercase",
    color: "var(--muted)",
    marginBottom: 8,
    display: "block",
  };

  if (submitted) {
    return (
      <div
        style={{
          padding: isMobile ? "60px 24px" : "80px 60px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 400,
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            background: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 32,
          }}
        >
          <CheckCircle size={40} color="var(--black)" strokeWidth={2.5} />
        </div>
        <h3
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: isMobile ? 36 : 48,
            letterSpacing: 2,
            marginBottom: 16,
          }}
        >
          Message Sent
        </h3>
        <p style={{ color: "var(--mid)", fontSize: 15, maxWidth: 360, lineHeight: 1.7 }}>
          Thanks for reaching out. Our team will get back to you within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: isMobile ? "60px 24px" : "80px 60px",
        background: "var(--black)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: isMobile ? 56 : 80,
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        {/* LEFT — form */}
        <div>
          <div style={{ marginBottom: isMobile ? 32 : 48 }}>
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 11,
                letterSpacing: 4,
                textTransform: "uppercase",
                color: "var(--accent)",
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span style={{ width: 30, height: 1, background: "var(--accent)", display: "block" }} />
              Send a Message
            </div>
            <h2
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "clamp(36px, 4vw, 56px)",
                lineHeight: 0.95,
                letterSpacing: 1,
              }}
            >
              LET&apos;S START A<br />
              <span style={{ WebkitTextStroke: "1px var(--white)", color: "transparent" }}>
                CONVERSATION
              </span>
            </h2>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: isMobile ? 16 : 24 }}>
            {/* Name + Email — stack on mobile */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input
                  name="name" value={form.name} onChange={handleChange} required
                  placeholder="John Doe"
                  style={{ ...inputStyle, borderColor: getBorder("name") }}
                  onFocus={() => setFocused("name")} onBlur={() => setFocused(null)}
                />
              </div>
              <div>
                <label style={labelStyle}>Email *</label>
                <input
                  name="email" type="email" value={form.email} onChange={handleChange} required
                  placeholder="you@email.com"
                  style={{ ...inputStyle, borderColor: getBorder("email") }}
                  onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
                />
              </div>
            </div>

            {/* Phone + Subject — stack on mobile */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>Phone</label>
                <input
                  name="phone" value={form.phone} onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                  style={{ ...inputStyle, borderColor: getBorder("phone") }}
                  onFocus={() => setFocused("phone")} onBlur={() => setFocused(null)}
                />
              </div>
              <div>
                <label style={labelStyle}>Subject *</label>
                <select
                  name="subject" value={form.subject} onChange={handleChange} required
                  style={{
                    ...inputStyle,
                    borderColor: getBorder("subject"),
                    cursor: "pointer",
                    appearance: "none",
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23666' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 16px center",
                  }}
                  onFocus={() => setFocused("subject")} onBlur={() => setFocused(null)}
                >
                  <option value="" style={{ background: "#141414" }}>Select a topic</option>
                  <option value="membership" style={{ background: "#141414" }}>Membership Enquiry</option>
                  <option value="training" style={{ background: "#141414" }}>Personal Training</option>
                  <option value="classes" style={{ background: "#141414" }}>Group Classes</option>
                  <option value="facility" style={{ background: "#141414" }}>Facility Tour</option>
                  <option value="other" style={{ background: "#141414" }}>Other</option>
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Message *</label>
              <textarea
                name="message" value={form.message} onChange={handleChange} required
                placeholder="Tell us how we can help..."
                rows={isMobile ? 5 : 6}
                style={{
                  ...inputStyle,
                  borderColor: getBorder("message"),
                  resize: "vertical",
                  minHeight: 120,
                }}
                onFocus={() => setFocused("message")} onBlur={() => setFocused(null)}
              />
            </div>

            <button
              type="submit"
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 14,
                letterSpacing: 3,
                textTransform: "uppercase",
                fontWeight: 700,
                background: "var(--accent)",
                color: "var(--black)",
                padding: "18px 48px",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                width: isMobile ? "100%" : "auto",
                alignSelf: isMobile ? "stretch" : "flex-start",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--white)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--accent)")}
            >
              <Send size={16} strokeWidth={2.5} />
              Send Message
            </button>
          </form>
        </div>

        {/* RIGHT — info */}
        <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 24 : 40 }}>
          <div>
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 11,
                letterSpacing: 4,
                textTransform: "uppercase",
                color: "var(--accent)",
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span style={{ width: 30, height: 1, background: "var(--accent)", display: "block" }} />
              Find Us
            </div>
            <h2
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "clamp(36px, 4vw, 56px)",
                lineHeight: 0.95,
                letterSpacing: 1,
                marginBottom: isMobile ? 24 : 40,
              }}
            >
              VISIT THE<br />
              <span style={{ WebkitTextStroke: "1px var(--white)", color: "transparent" }}>
                FORGE
              </span>
            </h2>
          </div>

          {/* Info cards — 2 col grid on mobile */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr",
              gap: isMobile ? 12 : 16,
            }}
          >
            {INFO_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  style={{
                    display: "flex",
                    gap: isMobile ? 12 : 20,
                    padding: isMobile ? "16px" : "24px",
                    border: "1px solid var(--border)",
                    transition: "border-color 0.3s",
                    alignItems: "flex-start",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                >
                  <div
                    style={{
                      width: isMobile ? 36 : 48,
                      height: isMobile ? 36 : 48,
                      background: "rgba(232,255,0,0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={isMobile ? 16 : 22} color="var(--accent)" strokeWidth={1.5} />
                  </div>
                  <div>
                    <div
                      style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontSize: 10,
                        letterSpacing: 3,
                        textTransform: "uppercase",
                        color: "var(--accent)",
                        marginBottom: 4,
                      }}
                    >
                      {item.title}
                    </div>
                    {item.lines.map((line) => (
                      <div
                        key={line}
                        style={{
                          fontSize: isMobile ? 12 : 14,
                          color: "var(--mid)",
                          lineHeight: 1.6,
                        }}
                      >
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
