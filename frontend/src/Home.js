import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <h1 className="home-heading">Home</h1>
      <div className="home-box">
        <p className="home-text">
          MeetCircle is a platform for events and collaboration.
        </p>
      </div>
      <div className="home-buttons">
        <button className="home-btn primary" onClick={() => navigate('/create')}>
          Create Event
        </button>
        <button className="home-btn secondary" onClick={() => navigate('/dashboard')}>
          View Dashboard
        </button>
      </div>
    </div>
  );
}

export default Home;
