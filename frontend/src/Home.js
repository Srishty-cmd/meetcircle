import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  const events = [
    {
      id: 1,
      title: 'Spring Street Fair',
      date: 'April 20, 2026',
      location: 'Downtown Plaza',
    },
    {
      id: 2,
      title: 'Local Food Festival',
      date: 'May 03, 2026',
      location: 'Riverside Park',
    },
    {
      id: 3,
      title: 'Community Cleanup Drive',
      date: 'May 18, 2026',
      location: 'Greenwood Neighborhood',
    },
  ];

  return (
    <div className="home-page">
      <section className="hero">
        <h1 className="hero-title">Discover Events Near You</h1>
        <p className="hero-subtitle">
          Join, explore, and connect with your community
        </p>
      </section>

      <section className="events-section">
        <h2 className="section-title">Upcoming Events</h2>
        <div className="events-grid">
          {events.map((event) => (
            <article className="event-card" key={event.id}>
              <h3 className="event-title">{event.title}</h3>
              <p className="event-meta">
                <span className="meta-label">Date:</span> {event.date}
              </p>
              <p className="event-meta">
                <span className="meta-label">Location:</span> {event.location}
              </p>
              <Link className="join-btn" to={`/event/${event.id}`}>
                Join
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;
