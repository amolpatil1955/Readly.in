import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";

const API_BASE = "http://localhost:3000/api/vi/user";

// ─── SUBTLE GEOMETRIC BACKGROUND ─────────────────────────────────────────────
function GeometricBg() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {/* Soft gradient blobs */}
      <div style={{
        position: "absolute", top: "-10%", right: "-5%",
        width: 500, height: 500, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)",
      }} />
      <div style={{
        position: "absolute", bottom: "-10%", left: "-5%",
        width: 400, height: 400, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(236,72,153,0.05) 0%, transparent 70%)",
      }} />
      {/* Fine grid */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)`,
        backgroundSize: "40px 40px",
      }} />
    </div>
  );
}

// ─── INPUT FIELD ─────────────────────────────────────────────────────────────
function Field({ label, type, value, onChange, placeholder, icon, error, showToggle, onToggle, showPass }) {
  return (
    <div>
      <label style={{
        display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
        textTransform: "uppercase", color: "#6b7280", marginBottom: 6,
        fontFamily: "'DM Sans', sans-serif"
      }}>{label}</label>
      <div style={{ position: "relative" }}>
        {icon && (
          <div style={{
            position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
            color: "#9ca3af", width: 16, height: 16, display: "flex", alignItems: "center"
          }}>{icon}</div>
        )}
        <input
          type={showToggle ? (showPass ? "text" : "password") : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          style={{
            width: "100%", boxSizing: "border-box",
            background: error ? "rgba(239,68,68,0.03)" : "#f9fafb",
            border: `1.5px solid ${error ? "#fca5a5" : "#e5e7eb"}`,
            borderRadius: 10, paddingLeft: icon ? 42 : 14,
            paddingRight: showToggle ? 42 : 14, paddingTop: 12, paddingBottom: 12,
            fontSize: 14, color: "#111827", outline: "none",
            transition: "border-color 0.2s, box-shadow 0.2s",
            fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
          }}
          onFocus={e => {
            e.target.style.borderColor = "#6366f1";
            e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)";
            e.target.style.background = "#fff";
          }}
          onBlur={e => {
            e.target.style.borderColor = error ? "#fca5a5" : "#e5e7eb";
            e.target.style.boxShadow = "none";
            e.target.style.background = error ? "rgba(239,68,68,0.03)" : "#f9fafb";
          }}
        />
        {showToggle && (
          <button
            type="button"
            onClick={onToggle}
            style={{
              position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer", color: "#9ca3af",
              padding: 0, display: "flex", alignItems: "center"
            }}
          >
            {showPass ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        )}
      </div>
      {error && (
        <p style={{ color: "#ef4444", fontSize: 12, marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>
          {error}
        </p>
      )}
    </div>
  );
}

// ─── PASSWORD STRENGTH ────────────────────────────────────────────────────────
function PasswordStrength({ password }) {
  if (!password) return null;
  const checks = [
    { label: "8+ chars", ok: password.length >= 8 },
    { label: "Uppercase", ok: /[A-Z]/.test(password) },
    { label: "Number", ok: /[0-9]/.test(password) },
    { label: "Symbol", ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const barColor = ["#ef4444", "#f97316", "#eab308", "#22c55e"][score - 1] || "#e5e7eb";
  const strengthLabel = ["Weak", "Fair", "Good", "Strong"][score - 1] || "";

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            height: 3, flex: 1, borderRadius: 2,
            background: i < score ? barColor : "#e5e7eb",
            transition: "background 0.3s"
          }} />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 10 }}>
          {checks.map(({ label, ok }) => (
            <span key={label} style={{
              fontSize: 11, fontFamily: "'DM Sans', sans-serif",
              color: ok ? "#22c55e" : "#9ca3af", fontWeight: ok ? 600 : 400,
              transition: "color 0.2s"
            }}>{ok ? "✓" : "○"} {label}</span>
          ))}
        </div>
        {score > 0 && (
          <span style={{ fontSize: 11, fontWeight: 700, color: barColor, fontFamily: "'DM Sans', sans-serif" }}>
            {strengthLabel}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── LEFT PANEL ───────────────────────────────────────────────────────────────
function LeftPanel({ mode }) {
  const isLogin = mode === "login";
  return (
    <div style={{
      display: "flex", flexDirection: "column", justifyContent: "space-between",
      padding: "48px 52px", minHeight: "100vh", position: "relative", overflow: "hidden",
      background: "linear-gradient(145deg, #0f0f1a 0%, #1a1025 50%, #0d0d1f 100%)",
    }}>
      {/* Decorative accent */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        background: "linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899)"
      }} />

      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative", zIndex: 2 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: "linear-gradient(135deg, #6366f1, #ec4899)",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <svg viewBox="0 0 24 24" fill="none" style={{ width: 20, height: 20 }}>
            <path d="M4 4h16v2H4V4zm0 4h10v2H4V8zm0 4h16v2H4v-2zm0 4h10v2H4v-2z" fill="white" />
          </svg>
        </div>
        <span style={{
          color: "#fff", fontWeight: 800, fontSize: 22,
          fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: "-0.02em"
        }}>Readly.in</span>
      </div>

      {/* Main content */}
      <div style={{ position: "relative", zIndex: 2 }}>
        <div style={{
          display: "inline-block", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)",
          borderRadius: 20, padding: "4px 14px", marginBottom: 24
        }}>
          <span style={{ color: "#818cf8", fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.05em" }}>
            {isLogin ? "WELCOME BACK" : "GET STARTED"}
          </span>
        </div>

        <h2 style={{
          color: "#fff", fontSize: 42, fontWeight: 800, lineHeight: 1.15,
          fontFamily: "'Playfair Display', Georgia, serif", marginBottom: 20,
          letterSpacing: "-0.02em"
        }}>
          {isLogin ? "Your Stories\nAre Waiting" : "Write. Share.\nInspire."}
        </h2>

        <p style={{ color: "#9ca3af", fontSize: 16, lineHeight: 1.7, maxWidth: 320, marginBottom: 40, fontFamily: "'DM Sans', sans-serif" }}>
          {isLogin
            ? "Continue your journey with thousands of readers who follow your work."
            : "Join a community of thinkers and writers shaping tomorrow's conversations."}
        </p>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 40 }}>
          {[
            isLogin ? ["4,200+", "Stories"] : ["Free", "Forever"],
            isLogin ? ["820+", "Authors"] : ["5 min", "Setup"],
            isLogin ? ["1.2M", "Readers"] : ["Global", "Audience"],
          ].map(([n, l]) => (
            <div key={l} style={{
              padding: "16px 14px", borderRadius: 14,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)"
            }}>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 18, fontFamily: "'Playfair Display', serif", marginBottom: 2 }}>{n}</div>
              <div style={{ color: "#6b7280", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Testimonial */}
        <div style={{
          padding: 24, borderRadius: 16,
          background: "rgba(99,102,241,0.06)",
          border: "1px solid rgba(99,102,241,0.12)"
        }}>
          <div style={{ color: "#6366f1", fontSize: 32, fontFamily: "Georgia, serif", lineHeight: 1, marginBottom: 12 }}>"</div>
          <p style={{ color: "#d1d5db", fontSize: 14, lineHeight: 1.7, fontStyle: "italic", marginBottom: 16, fontFamily: "'DM Sans', sans-serif" }}>
            Readly gave my ideas a home. Three months after my first post, I had 40,000 readers.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700, color: "#fff", fontFamily: "'DM Sans', sans-serif"
            }}>MC</div>
            <div>
              <div style={{ color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>Mira Chen</div>
              <div style={{ color: "#6b7280", fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>Technology Writer</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ color: "#374151", fontSize: 12, fontFamily: "'DM Sans', sans-serif", position: "relative", zIndex: 2 }}>
        © 2026 Readly.in. All rights reserved.
      </div>
    </div>
  );
}

// ─── ALERT ────────────────────────────────────────────────────────────────────
function AlertError({ message }) {
  if (!message) return null;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "12px 16px", borderRadius: 10,
      background: "#fef2f2", border: "1px solid #fecaca",
      color: "#dc2626", fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontWeight: 500
    }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16, flexShrink: 0 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {message}
    </div>
  );
}

// ─── SUBMIT BUTTON ─────────────────────────────────────────────────────────────
function SubmitButton({ loading, label, loadingLabel }) {
  return (
    <button
      type="submit"
      disabled={loading}
      style={{
        width: "100%", padding: "14px 0", borderRadius: 12, border: "none",
        background: loading ? "#c7d2fe" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
        color: "#fff", fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.01em",
        boxShadow: loading ? "none" : "0 4px 20px rgba(99,102,241,0.35)",
        transition: "box-shadow 0.2s, transform 0.1s",
      }}
      onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {loading ? (
        <>
          <svg style={{ animation: "spin 0.8s linear infinite", width: 16, height: 16 }} viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
          </svg>
          {loadingLabel}
        </>
      ) : label}
    </button>
  );
}

// ─── LOGIN FORM ───────────────────────────────────────────────────────────────
function LoginForm({ onSwitch, onSuccess }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const validate = () => {
    const e = {};
    if (!form.email) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password) e.password = "Password is required";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.token) localStorage.setItem("token", data.token);
        if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
        onSuccess("login");
      } else {
        setApiError(data.message || data.error || "Incorrect email or password");
      }
    } catch {
      setApiError("Could not connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const EmailIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16 }}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
  const LockIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16 }}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <AlertError message={apiError} />
      <Field label="Email Address" type="email" value={form.email}
        onChange={e => { setForm({ ...form, email: e.target.value }); setErrors({ ...errors, email: "" }); }}
        placeholder="you@example.com" error={errors.email} icon={EmailIcon} />
      <Field label="Password" type="password" value={form.password}
        onChange={e => { setForm({ ...form, password: e.target.value }); setErrors({ ...errors, password: "" }); }}
        placeholder="Your password" error={errors.password}
        showToggle showPass={showPass} onToggle={() => setShowPass(!showPass)} icon={LockIcon} />
      <div style={{ textAlign: "right", marginTop: -10 }}>
        <button type="button" style={{
          background: "none", border: "none", cursor: "pointer",
          color: "#6366f1", fontSize: 13, fontWeight: 600,
          fontFamily: "'DM Sans', sans-serif"
        }}>Forgot password?</button>
      </div>
      <SubmitButton loading={loading} label="Sign In →" loadingLabel="Signing in..." />
      <p style={{ textAlign: "center", color: "#9ca3af", fontSize: 14, fontFamily: "'DM Sans', sans-serif", margin: 0 }}>
        New to Readly?{" "}
        <button type="button" onClick={onSwitch} style={{
          background: "none", border: "none", cursor: "pointer",
          color: "#6366f1", fontWeight: 700, fontSize: 14, fontFamily: "'DM Sans', sans-serif"
        }}>Create account</button>
      </p>
    </form>
  );
}

// ─── REGISTER FORM ────────────────────────────────────────────────────────────
function RegisterForm({ onSwitch, onSuccess }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [apiError, setApiError] = useState("");

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 6) e.password = "Minimum 6 characters required";
    if (!form.confirm) e.confirm = "Please confirm your password";
    else if (form.confirm !== form.password) e.confirm = "Passwords do not match";
    if (!agreed) e.agreed = "Please accept the terms to continue";
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setApiError("");
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Username: form.name, email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.token) localStorage.setItem("token", data.token);
        if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
        // Mark as registered so next visit shows login
        localStorage.setItem("hasRegistered", "true");
        onSuccess("register");
      } else {
        setApiError(data.message || data.error || "Registration failed. Please try again.");
      }
    } catch {
      setApiError("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const set = k => e => { setForm({ ...form, [k]: e.target.value }); setErrors({ ...errors, [k]: "" }); };
  const UserIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16 }}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
  const EmailIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16 }}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
  const LockIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16 }}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <AlertError message={apiError} />
      <Field label="Full Name" type="text" value={form.name} onChange={set("name")} placeholder="Your full name" error={errors.name} icon={UserIcon} />
      <Field label="Email Address" type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" error={errors.email} icon={EmailIcon} />
      <div>
        <Field label="Password" type="password" value={form.password} onChange={set("password")}
          placeholder="Create a strong password" error={errors.password}
          showToggle showPass={showPass} onToggle={() => setShowPass(!showPass)} icon={LockIcon} />
        <PasswordStrength password={form.password} />
      </div>
      <Field label="Confirm Password" type="password" value={form.confirm} onChange={set("confirm")}
        placeholder="Re-enter your password" error={errors.confirm}
        showToggle showPass={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} icon={LockIcon} />

      {/* Terms checkbox */}
      <div>
        <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
          <div
            onClick={() => { setAgreed(!agreed); setErrors({ ...errors, agreed: "" }); }}
            style={{
              marginTop: 1, width: 18, height: 18, borderRadius: 5, flexShrink: 0,
              border: `2px solid ${agreed ? "#6366f1" : errors.agreed ? "#fca5a5" : "#d1d5db"}`,
              background: agreed ? "#6366f1" : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s"
            }}
          >
            {agreed && (
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} style={{ width: 11, height: 11 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <span style={{ color: "#6b7280", fontSize: 13, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>
            I agree to the{" "}
            <button type="button" style={{ background: "none", border: "none", cursor: "pointer", color: "#6366f1", fontWeight: 600, padding: 0, fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>Terms of Service</button>
            {" "}and{" "}
            <button type="button" style={{ background: "none", border: "none", cursor: "pointer", color: "#6366f1", fontWeight: 600, padding: 0, fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>Privacy Policy</button>
          </span>
        </label>
        {errors.agreed && <p style={{ color: "#ef4444", fontSize: 12, marginTop: 4, marginLeft: 28, fontFamily: "'DM Sans', sans-serif" }}>{errors.agreed}</p>}
      </div>

      <SubmitButton loading={loading} label="Create Account →" loadingLabel="Creating account..." />
      <p style={{ textAlign: "center", color: "#9ca3af", fontSize: 14, fontFamily: "'DM Sans', sans-serif", margin: 0 }}>
        Already have an account?{" "}
        <button type="button" onClick={onSwitch} style={{
          background: "none", border: "none", cursor: "pointer",
          color: "#6366f1", fontWeight: 700, fontSize: 14, fontFamily: "'DM Sans', sans-serif"
        }}>Sign in</button>
      </p>
    </form>
  );
}

// ─── SUCCESS SCREEN ───────────────────────────────────────────────────────────
function SuccessScreen({ mode }) {
  return (
    <div style={{
      textAlign: "center", padding: "32px 0",
      animation: "fadeUp 0.4s ease forwards"
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: "50%", margin: "0 auto 24px",
        background: "linear-gradient(135deg, #6366f1, #ec4899)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 8px 30px rgba(99,102,241,0.35)"
      }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} style={{ width: 32, height: 32 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 style={{
        fontSize: 24, fontWeight: 800, color: "#111827", marginBottom: 8,
        fontFamily: "'Playfair Display', serif"
      }}>
        {mode === "login" ? "Welcome back!" : "Account created!"}
      </h3>
      <p style={{ color: "#6b7280", fontSize: 14, fontFamily: "'DM Sans', sans-serif", marginBottom: 24 }}>
        Redirecting you to the homepage...
      </p>
      <div style={{
        height: 4, borderRadius: 2, background: "#f3f4f6", overflow: "hidden"
      }}>
        <div style={{
          height: "100%", borderRadius: 2,
          background: "linear-gradient(90deg, #6366f1, #ec4899)",
          animation: "progressBar 1.6s ease forwards"
        }} />
      </div>
    </div>
  );
}

// ─── MAIN AUTH PAGE ───────────────────────────────────────────────────────────
export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [success, setSuccess] = useState(false);
  const [successMode, setSuccessMode] = useState("login");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // If already logged in → redirect home
    if (localStorage.getItem("token")) {
      navigate("/");
      return;
    }
    // If previously registered → default to login tab
    const hasRegistered = localStorage.getItem("hasRegistered");
    if (hasRegistered) {
      setMode("login");
    }

    // Load fonts
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    setMounted(true);
  }, []);

  const handleSuccess = (m) => {
    setSuccessMode(m);
    setSuccess(true);
    setTimeout(() => navigate("/"), 1800);
  };

  const switchMode = (next) => {
    setMode(next);
    setSuccess(false);
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex",
      background: "#f8fafc",
      opacity: mounted ? 1 : 0,
      transition: "opacity 0.3s ease"
    }}>
      <GeometricBg />

      {/* LEFT PANEL — desktop only */}
      <div style={{
        display: "none",
        width: "45%", flexShrink: 0,
        // Show on large screens via media is handled by inline JS/CSS below
      }} className="auth-left-panel">
        <LeftPanel mode={mode} />
      </div>

      {/* RIGHT PANEL */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24, position: "relative", zIndex: 1,
        minHeight: "100vh"
      }}>
        <div style={{ width: "100%", maxWidth: 440 }}>

          {/* Mobile logo */}
          <div className="mobile-logo" style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", marginBottom: 36 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: "linear-gradient(135deg, #6366f1, #ec4899)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <svg viewBox="0 0 24 24" fill="none" style={{ width: 18, height: 18 }}>
                <path d="M4 4h16v2H4V4zm0 4h10v2H4V8zm0 4h16v2H4v-2zm0 4h10v2H4v-2z" fill="white" />
              </svg>
            </div>
            <span style={{ color: "#111827", fontWeight: 800, fontSize: 20, fontFamily: "'Playfair Display', serif" }}>Readly.in</span>
          </div>

          {/* Card */}
          <div style={{
            background: "#fff",
            borderRadius: 20,
            border: "1px solid #e5e7eb",
            padding: 36,
            boxShadow: "0 4px 40px rgba(0,0,0,0.08)",
          }}>
            {success ? (
              <SuccessScreen mode={successMode} />
            ) : (
              <>
                {/* Header */}
                <div style={{ marginBottom: 28 }}>
                  <h1 style={{
                    fontSize: 26, fontWeight: 800, color: "#111827", marginBottom: 6, margin: "0 0 6px",
                    fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: "-0.02em"
                  }}>
                    {mode === "login" ? "Welcome back" : "Create account"}
                  </h1>
                  <p style={{ color: "#9ca3af", fontSize: 14, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
                    {mode === "login"
                      ? "Sign in to access your stories and readers."
                      : "Start writing and inspiring people today."}
                  </p>
                </div>

                {/* Tab switcher */}
                <div style={{
                  display: "flex", marginBottom: 28,
                  background: "#f3f4f6", borderRadius: 12, padding: 4
                }}>
                  {[["login", "Sign In"], ["register", "Register"]].map(([m, label]) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => switchMode(m)}
                      style={{
                        flex: 1, padding: "10px 0", borderRadius: 9, border: "none",
                        cursor: "pointer", fontWeight: 700, fontSize: 14,
                        fontFamily: "'DM Sans', sans-serif",
                        transition: "all 0.2s",
                        background: mode === m ? "#fff" : "transparent",
                        color: mode === m ? "#111827" : "#9ca3af",
                        boxShadow: mode === m ? "0 1px 6px rgba(0,0,0,0.1)" : "none",
                      }}
                    >{label}</button>
                  ))}
                </div>

                {mode === "login"
                  ? <LoginForm onSwitch={() => switchMode("register")} onSuccess={handleSuccess} />
                  : <RegisterForm onSwitch={() => switchMode("login")} onSuccess={handleSuccess} />}
              </>
            )}
          </div>

          {/* Footer links */}
          {!success && (
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              marginTop: 16, padding: "0 4px"
            }}>
              <span style={{ color: "#d1d5db", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>
                🔒 Industry-standard encryption
              </span>
              <button
                onClick={() => navigate("/")}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "#9ca3af", fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 600, display: "flex", alignItems: "center", gap: 4
                }}
              >
                ← Back to Home
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes progressBar { from { width: 0%; } to { width: 100%; } }

        /* Show left panel on large screens */
        @media (min-width: 1024px) {
          .auth-left-panel { display: block !important; }
          .mobile-logo { display: none !important; }
        }

        * { box-sizing: border-box; }
        input::placeholder { color: #9ca3af !important; }
      `}</style>
    </div>
  );
}