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
    image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=400&h=200&fit=crop',
  },
  {
    id: 2,
    title: 'Community Tech Workshop',
    date: 'April 22, 2026',
    location: 'Innovation Hub',
    category: 'Workshop',
    image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=400&h=200&fit=crop',
  },
  {
    id: 3,
    title: 'Weekend Football Meetup',
    date: 'April 27, 2026',
    location: 'Greenfield Stadium',
    category: 'Sports',
    image: 'https://images.unsplash.com/photo-1508344928928-7165b67de128?q=80&w=400&h=200&fit=crop',
  },
  {
    id: 4,
    title: 'Art and Craft Showcase',
    date: 'May 02, 2026',
    location: 'Civic Art Center',
    category: 'Art',
    image: 'https://images.unsplash.com/photo-1460518451285-8f6920f04f2f?q=80&w=400&h=200&fit=crop',
  },
  {
    id: 5,
    title: 'Open Mic Night',
    date: 'May 09, 2026',
    location: 'Downtown Cafe',
    category: 'Music',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400&h=200&fit=crop',
  },
  {
    id: 6,
    title: 'Startup Networking Session',
    date: 'May 14, 2026',
    location: 'Metro Co-Working Space',
    category: 'Networking',
    image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=400&h=200&fit=crop',
  },
];

function EventList() {
  const categories = useMemo(
    () => ['All', ...new Set(events.map((event) => event.category))],
    []
  );
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTitle, setSearchTitle] = useState('');
  const [searchLocation, setSearchLocation] = useState('');

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesCategory = selectedCategory === 'All' || event.category === selectedCategory;
      const matchesTitle = event.title.toLowerCase().includes(searchTitle.toLowerCase());
      const matchesLocation = event.location.toLowerCase().includes(searchLocation.toLowerCase());
      return matchesCategory && matchesTitle && matchesLocation;
    });
  }, [selectedCategory, searchTitle, searchLocation]);

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
          <input
            type="text"
            className="filter-input"
            placeholder="Search by title..."
            value={searchTitle}
            onChange={(e) => setSearchTitle(e.target.value)}
          />
          <input
            type="text"
            className="filter-input"
            placeholder="Filter by location..."
            value={searchLocation}
            onChange={(e) => setSearchLocation(e.target.value)}
          />
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

        {filteredEvents.length === 0 ? (
          <div className="no-events-message">
            <p>No events found matching your criteria.</p>
          </div>
        ) : (
          <div className="event-grid">
            {filteredEvents.map((event) => (
              <article className="event-card" key={event.id}>
                <img src={event.image} alt={event.title} className="event-image" />
                <div className="event-content">
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
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default EventList;
