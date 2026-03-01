import { useState } from "react";
import languageText from "../data/languageText";
import "./HelpDesk.css";

function HelpDesk() {
  const [language, setLanguage] = useState("en");
  const text = languageText[language];

  return (
    <div className="helpdesk-page">
      <div className="helpdesk-card">

        {/* 🌍 Language Selector */}
        <div className="helpdesk-language">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="en">English</option>
            <option value="mr">मराठी</option>
            <option value="hi">हिंदी</option>
          </select>
        </div>

        <h2>{text.helpDeskTitle}</h2>

        <p className="helpdesk-text">
          {text.helpDeskContactInfo}
        </p>

        {/* 📞 Call Support */}
        <a
          href="tel:+919867918709"
          className="helpdesk-btn call-btn"
        >
          📞 {text.callSupport}
        </a>

        {/* 💬 WhatsApp Support */}
        <a
          href="https://wa.me/919867918709"
          target="_blank"
          rel="noopener noreferrer"
          className="helpdesk-btn whatsapp-btn"
        >
          💬 {text.whatsappSupport}
        </a>

      </div>
    </div>
  );
}

export default HelpDesk;



