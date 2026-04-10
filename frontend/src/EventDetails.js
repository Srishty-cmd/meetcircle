import './EventDetails.css';
import { useParams } from 'react-router-dom';

function EventDetails() {
  const { id } = useParams();
  const eventsById = {
    1: {
      title: 'City Music Evening',
      description:
        'Enjoy live music performances from local bands and artists in a fun and relaxed atmosphere.',
      dateTime: 'April 18, 2026 - 6:30 PM',
      location: 'Riverfront Stage',
      category: 'Music',
    },
    2: {
      title: 'Community Tech Workshop',
      description:
        'Learn practical web development and AI basics with hands-on sessions led by community mentors.',
      dateTime: 'April 22, 2026 - 4:00 PM',
      location: 'Innovation Hub',
      category: 'Workshop',
    },
    3: {
      title: 'Weekend Football Meetup',
      description:
        'Friendly football matches for all skill levels. Great way to stay active and meet new people.',
      dateTime: 'April 27, 2026 - 7:00 AM',
      location: 'Greenfield Stadium',
      category: 'Sports',
    },
  };
  const event = eventsById[id] || {
    title: 'Community Innovation Meetup',
    description:
      'Join local creators, students, and entrepreneurs for an engaging event focused on innovation and collaboration.',
    dateTime: 'May 18, 2026 - 5:30 PM',
    location: 'Innovation Hub, Downtown',
    category: 'Workshop',
  };

  const participants = [
    'Aarav Sharma',
    'Priya Patel',
    'Rohan Mehta',
    'Neha Gupta',
    'Ishaan Verma',
  ];

  return (
    <main className="event-details-page">
      <section className="event-details-card">
        <header className="event-header">
          <h1 className="event-title">{event.title}</h1>
          <span className="event-category">{event.category}</span>
        </header>

        <section className="event-section">
          <h2 className="section-heading">Description</h2>
          <p className="section-text">{event.description}</p>
        </section>

        <section className="event-section event-highlight-grid">
          <div className="highlight-box">
            <p className="highlight-label">Date and Time</p>
            <p className="highlight-value">{event.dateTime}</p>
          </div>
          <div className="highlight-box">
            <p className="highlight-label">Location</p>
            <p className="highlight-value">{event.location}</p>
          </div>
        </section>

        <button className="join-button" type="button">
          Join Event
        </button>

        <section className="event-section participants-section">
          <h2 className="section-heading">Participants</h2>
          <ul className="participants-list">
            {participants.map((participant) => (
              <li className="participant-item" key={participant}>
                {participant}
              </li>
            ))}
          </ul>
        </section>
      </section>
    </main>
  );
}

export default EventDetails;
