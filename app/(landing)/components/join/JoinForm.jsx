"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PlanSelector from "./PlanSelector";

const PERKS = [
  { icon: "⚡", title: "Instant Access", desc: "QR pass delivered to your email immediately after signup." },
  { icon: "🏋️", title: "World-Class Equipment", desc: "50,000 sq ft of the latest cardio, strength, and functional gear." },
  { icon: "🎯", title: "Personal Trainer Match", desc: "We match you with the right trainer based on your goals." },
  { icon: "📱", title: "IronForge App", desc: "Track workouts, book classes, and monitor progress on the go." },
  { icon: "🔒", title: "No Lock-In Contracts", desc: "Cancel anytime, no questions asked. We earn your loyalty." },
  { icon: "🥗", title: "Nutrition Guidance", desc: "Access to nutrition plans built by certified dietitians." },
];

const BADGES = [
  { num: "500+", label: "Members" },
  { num: "5★",   label: "Rating"  },
  { num: "6 Yrs",label: "Established" },
];

export default function JoinForm() {
  const router = useRouter();

  const [focused,      setFocused]      = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [step,         setStep]         = useState(1);
  const [isMobile,     setIsMobile]     = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [submitError,  setSubmitError]  = useState('');
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    dob: "", goal: "", emergency_name: "", emergency_phone: "", agreed: false,
  });

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const handleChange = (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: val });
    setSubmitError('');
  };

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

  // ── Submit to API ─────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.agreed) return;

    setSubmitting(true);
    setSubmitError('');

    try {
      const res = await fetch('/api/leads/submit', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name:    form.firstName.trim(),
          last_name:     form.lastName.trim(),
          email:         form.email.trim(),
          phone:         form.phone.trim(),
          date_of_birth: form.dob || null,
          message:       form.goal ? `Goal: ${form.goal}` : '',
          source:             'website',
          interested_plan_id: selectedPlan || null,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setSubmitError(json.error || 'Something went wrong. Please try again.');
        return;
      }

      router.push('/thank-you');

    } catch {
      setSubmitError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ padding: isMobile ? "48px 24px" : "80px 60px", background: "var(--black)" }}>
      <div style={{
        maxWidth: 1200,
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
        gap: isMobile ? 56 : 80,
      }}>

        {/* LEFT — form steps */}
        <div>
          {step === 1 && (
            <>
              <PlanSelector selected={selectedPlan} onSelect={setSelectedPlan} />
              <button
                onClick={() => setStep(2)}
                disabled={!selectedPlan}
                style={{
                  marginTop: 32,
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 14,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  fontWeight: 700,
                  background: selectedPlan ? "var(--accent)" : "var(--border)",
                  color: selectedPlan ? "var(--black)" : "var(--muted)",
                  padding: "18px 48px",
                  border: "none",
                  cursor: selectedPlan ? "pointer" : "not-allowed",
                  transition: "all 0.2s",
                  width: "100%",
                }}
                onMouseEnter={(e) => { if (selectedPlan) e.currentTarget.style.background = "var(--white)"; }}
                onMouseLeave={(e) => { if (selectedPlan) e.currentTarget.style.background = "var(--accent)"; }}
              >
                Continue →
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div style={{ marginBottom: isMobile ? 28 : 40 }}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, letterSpacing: 4, textTransform: "uppercase", color: "var(--accent)", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ width: 30, height: 1, background: "var(--accent)", display: "block" }} />
                  Step 2 — Your Details
                </div>
                <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(36px, 4vw, 56px)", lineHeight: 0.95, letterSpacing: 1 }}>
                  PERSONAL<br />
                  <span style={{ WebkitTextStroke: "1px var(--white)", color: "transparent" }}>INFORMATION</span>
                </h2>
              </div>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: isMobile ? 14 : 20 }}>

                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={labelStyle}>First Name *</label>
                    <input name="firstName" value={form.firstName} onChange={handleChange} required placeholder="John"
                      style={{ ...inputStyle, borderColor: getBorder("firstName") }}
                      onFocus={() => setFocused("firstName")} onBlur={() => setFocused(null)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Last Name *</label>
                    <input name="lastName" value={form.lastName} onChange={handleChange} required placeholder="Doe"
                      style={{ ...inputStyle, borderColor: getBorder("lastName") }}
                      onFocus={() => setFocused("lastName")} onBlur={() => setFocused(null)} />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Email Address *</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="you@email.com"
                    style={{ ...inputStyle, borderColor: getBorder("email") }}
                    onFocus={() => setFocused("email")} onBlur={() => setFocused(null)} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Phone *</label>
                    <input name="phone" value={form.phone} onChange={handleChange} required placeholder="+91 98765 43210"
                      style={{ ...inputStyle, borderColor: getBorder("phone") }}
                      onFocus={() => setFocused("phone")} onBlur={() => setFocused(null)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Date of Birth</label>
                    <input name="dob" type="date" value={form.dob} onChange={handleChange}
                      style={{ ...inputStyle, borderColor: getBorder("dob"), colorScheme: "dark" }}
                      onFocus={() => setFocused("dob")} onBlur={() => setFocused(null)} />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Primary Fitness Goal</label>
                  <select name="goal" value={form.goal} onChange={handleChange}
                    style={{ ...inputStyle, borderColor: getBorder("goal"), cursor: "pointer", appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23666' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 16px center" }}
                    onFocus={() => setFocused("goal")} onBlur={() => setFocused(null)}
                  >
                    <option value="" style={{ background: "#141414" }}>Select your goal</option>
                    <option value="weight-loss" style={{ background: "#141414" }}>Weight Loss</option>
                    <option value="muscle-gain" style={{ background: "#141414" }}>Muscle Gain</option>
                    <option value="endurance" style={{ background: "#141414" }}>Endurance & Cardio</option>
                    <option value="flexibility" style={{ background: "#141414" }}>Flexibility & Yoga</option>
                    <option value="general" style={{ background: "#141414" }}>General Fitness</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Emergency Contact</label>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
                    <input name="emergency_name" value={form.emergency_name} onChange={handleChange} placeholder="Contact name"
                      style={{ ...inputStyle, borderColor: getBorder("emergency_name") }}
                      onFocus={() => setFocused("emergency_name")} onBlur={() => setFocused(null)} />
                    <input name="emergency_phone" value={form.emergency_phone} onChange={handleChange} placeholder="Contact phone"
                      style={{ ...inputStyle, borderColor: getBorder("emergency_phone") }}
                      onFocus={() => setFocused("emergency_phone")} onBlur={() => setFocused(null)} />
                  </div>
                </div>

                {/* T&C */}
                <div
                  style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: isMobile ? "14px 16px" : "16px 20px", border: "1px solid var(--border)", cursor: "pointer" }}
                  onClick={() => setForm({ ...form, agreed: !form.agreed })}
                >
                  <div style={{ width: 20, height: 20, border: `2px solid ${form.agreed ? "var(--accent)" : "var(--border)"}`, background: form.agreed ? "var(--accent)" : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", marginTop: 1 }}>
                    {form.agreed && <span style={{ color: "var(--black)", fontSize: 12, fontWeight: 700 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: isMobile ? 12 : 13, color: "var(--muted)", lineHeight: 1.6 }}>
                    I agree to the IronForge{" "}
                    <span style={{ color: "var(--accent)", textDecoration: "underline" }}>Terms & Conditions</span>{" "}
                    and{" "}
                    <span style={{ color: "var(--accent)", textDecoration: "underline" }}>Membership Agreement</span>.
                    I confirm I am in good health to participate in physical exercise.
                  </span>
                </div>

                {/* Submit error */}
                {submitError && (
                  <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 13, color: "#ef4444", padding: "12px 16px", background: "rgba(239,68,68,0.09)", border: "1px solid #ef4444" }}>
                    {submitError}
                  </p>
                )}

                {/* Buttons */}
                <div style={{ display: "flex", gap: 12 }}>
                  <button type="button" onClick={() => setStep(1)}
                    style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, letterSpacing: 3, textTransform: "uppercase", fontWeight: 700, background: "transparent", color: "var(--white)", padding: isMobile ? "16px 20px" : "17px 32px", border: "1px solid var(--border)", cursor: "pointer", transition: "all 0.2s", flexShrink: 0 }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--white)"; }}
                  >
                    ← Back
                  </button>
                  <button type="submit" disabled={!form.agreed || submitting}
                    style={{ flex: 1, fontFamily: "'Barlow Condensed', sans-serif", fontSize: isMobile ? 12 : 14, letterSpacing: 3, textTransform: "uppercase", fontWeight: 700, background: (form.agreed && !submitting) ? "var(--accent)" : "var(--border)", color: (form.agreed && !submitting) ? "var(--black)" : "var(--muted)", padding: "18px 24px", border: "none", cursor: (form.agreed && !submitting) ? "pointer" : "not-allowed", transition: "all 0.2s" }}
                    onMouseEnter={(e) => { if (form.agreed && !submitting) e.currentTarget.style.background = "var(--white)"; }}
                    onMouseLeave={(e) => { if (form.agreed && !submitting) e.currentTarget.style.background = "var(--accent)"; }}
                  >
                    {submitting ? 'Submitting...' : 'Complete Registration'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        {/* RIGHT — perks + badges — unchanged */}
        <div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, letterSpacing: 4, textTransform: "uppercase", color: "var(--accent)", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 30, height: 1, background: "var(--accent)", display: "block" }} />
            Why IronForge
          </div>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(36px, 4vw, 56px)", lineHeight: 0.95, letterSpacing: 1, marginBottom: isMobile ? 24 : 40 }}>
            WHAT YOU<br />
            <span style={{ WebkitTextStroke: "1px var(--white)", color: "transparent" }}>GET</span>
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr", gap: isMobile ? 12 : 16, marginBottom: isMobile ? 24 : 48 }}>
            {PERKS.map((perk) => (
              <div key={perk.title}
                style={{ display: "flex", gap: isMobile ? 10 : 16, padding: isMobile ? "14px" : "20px", border: "1px solid var(--border)", transition: "border-color 0.3s", alignItems: "flex-start" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              >
                <div style={{ width: isMobile ? 32 : 44, height: isMobile ? 32 : 44, background: "rgba(232,255,0,0.07)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: isMobile ? 14 : 20, flexShrink: 0 }}>
                  {perk.icon}
                </div>
                <div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: isMobile ? 12 : 15, letterSpacing: 1, textTransform: "uppercase", color: "var(--white)", marginBottom: 2 }}>
                    {perk.title}
                  </div>
                  {!isMobile && <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>{perk.desc}</div>}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: "var(--border)", border: "1px solid var(--border)" }}>
            {BADGES.map((b) => (
              <div key={b.label} style={{ background: "var(--card)", padding: isMobile ? "16px 12px" : "20px", textAlign: "center" }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: isMobile ? 28 : 36, color: "var(--accent)", lineHeight: 1 }}>{b.num}</div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "var(--muted)" }}>{b.label}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
