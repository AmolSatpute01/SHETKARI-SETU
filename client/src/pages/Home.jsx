import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import languageText from "../data/languageText";

function Home({ language, setLanguage }) {
  const navigate = useNavigate();
  const text = useMemo(() => languageText[language], [language]);

  // ✅ Mobile menu
  const [menuOpen, setMenuOpen] = useState(false);

  // ✅ scroll helper
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (!el) return;

    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setMenuOpen(false);
  };

  // ✅ Service Icons mapping
  const serviceIcons = ["🌾", "📦", "🌐", "🚜", "📊", "📞"];

  return (
    <div style={{ background: "#f9fbf9", minHeight: "100vh" }}>
      {/* ✅ NAVBAR */}
      <header className="home-navbar">
        <div className="home-nav-inner">
          <div
            className="home-logo"
            onClick={() => scrollTo("home")}
            style={{ cursor: "pointer", fontWeight: "bold", color: "#2e7d32" }}
            title="Go to Home"
          >
            🌿 Shetkari Setu
          </div>

          <nav className="home-nav-links">
            <button className="home-nav-link" onClick={() => scrollTo("home")}>
              {text.homeNav || "Home"}
            </button>
            <button className="home-nav-link" onClick={() => scrollTo("about")}>
              {text.aboutTitle || "About"}
            </button>
            <button className="home-nav-link" onClick={() => scrollTo("services")}>
              {text.servicesTitle || "Services"}
            </button>
            <button className="home-nav-link" onClick={() => scrollTo("contact")}>
              {text.contactTitle || "Contact"}
            </button>
          </nav>

          <div className="home-nav-right">
            <select
              className="home-lang"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{ borderRadius: "8px", padding: "5px", border: "1px solid #ddd" }}
            >
              <option value="en">English</option>
              <option value="mr">मराठी</option>
              <option value="hi">हिंदी</option>
            </select>

            <button
              className="home-auth-btn"
              onClick={() => navigate("/register")}
              style={{ background: "#2e7d32", color: "white", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
            >
              {text.signinRegisterBtn || "Signin  /  Register"}
            </button>

            <button className="home-menu-btn" onClick={() => setMenuOpen((p) => !p)}>
              ☰
            </button>
          </div>
        </div>
      </header>

      {/* ✅ HERO SECTION */}
      <section className="home-hero" id="home" style={{ background: "linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)", color: "white", padding: "60px 20px" }}>
        <div className="home-hero-inner">
          <div className="home-hero-left">
            <h1 className="home-hero-title" style={{ fontSize: "2.5rem", marginBottom: "15px" }}>
              {text.title || "Shetkari Setu"}
            </h1>
            <p className="home-hero-subtitle" style={{ fontSize: "1.2rem", opacity: "0.9" }}>
              {text.subtitle || "A Digital Bridge to Support Farmers"}
            </p>
            <p className="home-hero-desc" style={{ marginTop: "15px", maxWidth: "500px", lineHeight: "1.6" }}>
              {text.description || "Shetkari Setu is a digital platform designed to assist farmers in managing their agricultural activities efficiently and transparently."}
            </p>
            <div className="home-hero-actions" style={{ marginTop: "25px", display: "flex", gap: "15px" }}>
              <button className="home-primary-btn" onClick={() => navigate("/register")} style={{ background: "white", color: "#2e7d32", border: "none", padding: "12px 24px", borderRadius: "8px", fontWeight: "bold" }}>
                {text.getStartedBtn || "Get Started"}
              </button>
              <button className="home-outline-btn" onClick={() => scrollTo("services")} style={{ background: "transparent", color: "white", border: "2px solid white", padding: "12px 24px", borderRadius: "8px", fontWeight: "bold" }}>
                {text.exploreServicesBtn || "Explore Services"}
              </button>
            </div>
          </div>

          <div className="home-hero-right">
            <div className="home-hero-card" style={{ background: "rgba(255, 255, 255, 0.15)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.3)" }}>
              <div className="home-hero-card-top">
                <div className="home-avatar" style={{ background: "#4caf50", padding: "10px", borderRadius: "50%" }}>👩‍🌾</div>
                <div>
                  <div className="home-card-title">{text.trustedPlatformTitle || "Trusted Platform"}</div>
                  <div className="home-card-sub">{text.trustedPlatformSub || "Farmer → Customer direct connection ✅"}</div>
                </div>
              </div>
              <div className="home-stat-grid">
                <div className="home-stat"><div>24/7</div><small>{text.supportText || "Support"}</small></div>
                <div className="home-stat"><div>Fast</div><small>{text.orderingText || "Ordering"}</small></div>
                <div className="home-stat"><div>Secure</div><small>{text.secureText || "Login + OTP"}</small></div>
                <div className="home-stat"><div>Fresh</div><small>{text.freshText || "Products"}</small></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ✅ ABOUT (Removed Underline & Reduced Gap) */}
      <section className="home-section" id="about" style={{ padding: "40px 20px" }}>
        <div className="home-section-inner">
          <h2 className="home-section-title" style={{ color: "#2e7d32", marginBottom: "15px" }}>
            {text.aboutTitle || "About"}
          </h2>
          <p className="home-section-text" style={{ fontSize: "1.1rem", color: "#444", maxWidth: "800px" }}>
            {text.aboutText || "ShetkariSetu is designed to help farmers sell products directly to customers. It improves trust, reduces middlemen, and provides a simple dashboard for farmers and customers."}
          </p>
        </div>
      </section>

      {/* ✅ SERVICES */}
      <section className="home-section alt" id="services" style={{ background: "#f0f4f0", padding: "40px 20px" }}>
        <div className="home-section-inner">
          <h2 className="home-section-title" style={{ color: "#2e7d32", marginBottom: "30px" }}>
            {text.servicesTitle || "Services"}
          </h2>

          <div className="home-service-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "25px" }}>
            {(text.services || []).slice(0, 6).map((s, i) => (
              <div 
                className="home-service-card" 
                key={i} 
                style={{ 
                  background: "white", 
                  padding: "30px", 
                  borderRadius: "15px", 
                  borderTop: "5px solid #2e7d32", 
                  boxShadow: "0 4px 15px rgba(0,0,0,0.05)"
                }}
              >
                <div className="home-service-icon" style={{ fontSize: "2rem", marginBottom: "15px" }}>
                  {serviceIcons[i] || "🌾"}
                </div>
                <div className="home-service-name" style={{ color: "#2e7d32", fontWeight: "bold", fontSize: "1.2rem", marginBottom: "10px" }}>
                  {s.title}
                </div>
                <div className="home-service-desc" style={{ color: "#666", lineHeight: "1.5" }}>
                  {s.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ✅ CONTACT (Restored Original Style & Removed Login Now) */}
      <section className="home-section" id="contact" style={{ padding: "40px 20px" }}>
        <div className="home-section-inner">
          <h2 className="home-section-title">
            {text.contactTitle || "Contact"}
          </h2>

          <p className="home-section-text">
            {text.contactText ||
              "Need help? Open HelpDesk or contact support anytime."}
          </p>

          <div className="home-contact-row">
            <button
              className="home-primary-btn"
              onClick={() => navigate("/helpdesk")}
            >
              {text.helpdeskBtn || "Open HelpDesk"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;



