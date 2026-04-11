import React from "react";
import { useNavigate } from "react-router-dom";
import "./Landing.css";

function Landing({ darkMode, onToggleDark }) {
  const navigate = useNavigate();

  return (
    <div className="landing">
      <button
        type="button"
        className="landing-theme-toggle"
        onClick={onToggleDark}
        aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      >
        {darkMode ? "☀️" : "🌙"}
      </button>
      <div className="landing-inner">
        <p className="landing-eyebrow">Welcome</p>
        <h1 className="landing-brand">MeetCircle</h1>
        <p className="landing-tagline">
          Connect through events, hackathons, and collaborations — discover
          opportunities, build teams, and bring ideas to life.
        </p>
        <button
          type="button"
          className="landing-start"
          onClick={() => navigate("/login")}
        >
          Start
        </button>
        <p className="landing-hint">
          New here? Tap Start to sign in or register, then explore Home, Create,
          and Dashboard.
        </p>
      </div>
    </div>
  );
}

export default Landing;
