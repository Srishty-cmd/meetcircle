import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import './EventList.css';

const events = [
  {
    id: 1,
    title: 'City Music Evening',
    date: 'April 18, 2026',
    location: 'Riverfront Stage',
    category: 'Music',
  },
  {
    id: 2,
    title: 'Community Tech Workshop',
    date: 'April 22, 2026',
    location: 'Innovation Hub',
    category: 'Workshop',
  },
  {
    id: 3,
    title: 'Weekend Football Meetup',
    date: 'April 27, 2026',
    location: 'Greenfield Stadium',
    category: 'Sports',
  },
  {
    id: 4,
    title: 'Art and Craft Showcase',
    date: 'May 02, 2026',
    location: 'Civic Art Center',
    category: 'Art',
  },
  {
    id: 5,
    title: 'Open Mic Night',
    date: 'May 09, 2026',
    location: 'Downtown Cafe',
    category: 'Music',
  },
  {
    id: 6,
    title: 'Startup Networking Session',
    date: 'May 14, 2026',
    location: 'Metro Co-Working Space',
    category: 'Networking',
  },
];

function EventList() {
  const categories = useMemo(
    () => ['All', ...new Set(events.map((event) => event.category))],
    []
  );
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredEvents = useMemo(() => {
    if (selectedCategory === 'All') {
      return events;
    }
    return events.filter((event) => event.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <main className="event-list-page">
      <section className="event-list-wrapper">
        <div className="event-list-header">
          <h1 className="event-list-title">Event List</h1>
          <p className="event-list-subtitle">
            Explore local events and join what interests you
          </p>
        </div>

        <div className="filter-row">
          <label className="filter-label" htmlFor="category">
            Filter by category
          </label>
          <select
            id="category"
            className="filter-select"
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="event-grid">
          {filteredEvents.map((event) => (
            <article className="event-card" key={event.id}>
              <h2 className="event-title">{event.title}</h2>
              <p className="event-info">
                <span className="info-label">Date:</span> {event.date}
              </p>
              <p className="event-info">
                <span className="info-label">Location:</span> {event.location}
              </p>
              <p className="event-info">
                <span className="info-label">Category:</span> {event.category}
              </p>
              <Link className="join-button" to={`/event/${event.id}`}>
                Join
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default EventList;
