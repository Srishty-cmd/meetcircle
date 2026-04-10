import './Dashboard.css';

function Dashboard() {
  const createdEvents = [
    {
      id: 1,
      title: 'Community Coding Meetup',
      date: 'April 25, 2026',
      location: 'Tech Hub Center',
      category: 'Workshop',
    },
    {
      id: 2,
      title: 'Neighborhood Fitness Camp',
      date: 'May 03, 2026',
      location: 'Sunrise Park',
      category: 'Sports',
    },
    {
      id: 3,
      title: 'Local Art Exhibition',
      date: 'May 10, 2026',
      location: 'City Art Hall',
      category: 'Art',
    },
  ];

  const joinedEvents = [
    {
      id: 4,
      title: 'Weekend Music Jam',
      date: 'April 20, 2026',
      location: 'Riverfront Stage',
      category: 'Music',
    },
    {
      id: 5,
      title: 'Startup Networking Night',
      date: 'May 08, 2026',
      location: 'Innovation Lounge',
      category: 'Networking',
    },
    {
      id: 6,
      title: 'Community Cleanup Drive',
      date: 'May 15, 2026',
      location: 'Greenwood District',
      category: 'Social',
    },
  ];

  const renderCard = (event) => (
    <article className="event-card" key={event.id}>
      <h3 className="event-title">{event.title}</h3>
      <p className="event-meta">
        <span className="meta-label">Date:</span> {event.date}
      </p>
      <p className="event-meta">
        <span className="meta-label">Location:</span> {event.location}
      </p>
      <p className="event-meta">
        <span className="meta-label">Category:</span> {event.category}
      </p>
    </article>
  );

  return (
    <div className="dashboard-page">
      <main className="dashboard-content">
        <section className="dashboard-section">
          <h2 className="section-title">My Created Events</h2>
          <div className="events-grid">{createdEvents.map(renderCard)}</div>
        </section>

        <section className="dashboard-section">
          <h2 className="section-title">Joined Events</h2>
          <div className="events-grid">{joinedEvents.map(renderCard)}</div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
