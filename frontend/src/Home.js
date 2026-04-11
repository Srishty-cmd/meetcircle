import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home">
      <header className="home-header">
        <p className="home-eyebrow">MeetCircle</p>
        <h1 className="home-heading">Home</h1>
      </header>

      <section className="home-description-box" aria-label="About MeetCircle">
        <p className="home-description-text">
          MeetCircle is a smart platform that connects people through events,
          hackathons, and collaborations. Discover opportunities, build teams,
          and bring your ideas to life — all in one place.
        </p>
      </section>

      <div className="home-buttons">
        <button
          type="button"
          className="home-btn home-btn-create"
          onClick={() => navigate('/create')}
        >
          Create Event
        </button>
        <button
          type="button"
          className="home-btn home-btn-dashboard"
          onClick={() => navigate('/dashboard')}
        >
          View Dashboard
        </button>
      </div>

      <section className="home-cards" aria-label="Features">
        <article className="home-card">
          <h2 className="home-card-title">Create Events</h2>
          <p className="home-card-text">
            Easily organize hackathons, meetups, and community events.
          </p>
        </article>
        <article className="home-card">
          <h2 className="home-card-title">Dashboard</h2>
          <p className="home-card-text">
            Manage events, track participants, and stay updated.
          </p>
        </article>
      </section>
    </div>
  );
}

export default Home;
