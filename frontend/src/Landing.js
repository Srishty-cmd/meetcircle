import React from "react";
import { useNavigate } from "react-router-dom";
import "./Landing.css";

function Landing({ darkMode, onToggleDark }) {
  const navigate = useNavigate();

  return (
    <div className="landing">
      
      <nav className="landing-nav">
        <div className="landing-logo">MeetCircle</div>
        <button
          type="button"
          className="landing-theme-toggle"
          onClick={onToggleDark}
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? "☀️ Light" : "🌙 Dark"}
        </button>
      </nav>

      <div className="landing-container">
        <div className="landing-hero">
          <div className="landing-badge">✨ Redefining Connections</div>
          <h1 className="landing-brand">
            Where Great <br />
            <span className="text-gradient">Ideas Connect</span>
          </h1>
          <p className="landing-tagline">
            Experience the future of event management. Discover opportunities,
            build dynamic teams, and bring your visionary ideas to life through
            seamless collaboration.
          </p>
          <div className="landing-actions">
            <button
              type="button"
              className="landing-start"
              onClick={() => navigate("/login")}
            >
              Get Started <span className="arrow">→</span>
            </button>
            <button
              type="button"
              className="landing-secondary"
              onClick={() => navigate("/login")}
            >
              Explore Dashboard
            </button>
          </div>
        </div>

        <div className="landing-visual">
          <div className="glass-card main-card">
            <div className="card-header">
              <div className="dots">
                <span className="dot red"></span>
                <span className="dot yellow"></span>
                <span className="dot green"></span>
              </div>
            </div>
            <div className="card-body">
              <div className="mock-event">
                <div className="mock-icon">🚀</div>
                <div className="mock-info">
                  <h4>Global Tech Hackathon</h4>
                  <p>Joining 1,200+ developers...</p>
                </div>
                <div className="mock-status">Live</div>
              </div>
              <div className="mock-event">
                <div className="mock-icon">💡</div>
                <div className="mock-info">
                  <h4>Design Innovation Workshop</h4>
                  <p>Starting in 2 hours</p>
                </div>
                <div className="mock-status pending">Coming Soon</div>
              </div>
              <div className="mock-event">
                <div className="mock-icon">🎨</div>
                <div className="mock-info">
                  <h4>Creative Minds Meetup</h4>
                  <p>Networking and showcase</p>
                </div>
                <div className="mock-status">Join</div>
              </div>
            </div>
          </div>
          
          <div className="glass-card stat-card float-1">
            <div className="stat-value">10k+</div>
            <div className="stat-label">Active Users</div>
          </div>
          
          <div className="glass-card stat-card float-2">
            <div className="stat-value">500+</div>
            <div className="stat-label">Weekly Events</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Landing;
