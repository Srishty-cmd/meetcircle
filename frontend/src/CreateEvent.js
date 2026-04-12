import { useState } from 'react';
import './CreateEvent.css';

function CreateEvent() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    category: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Attempt reverse geocoding to get a real address
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          if (!response.ok) throw new Error('Network response was not ok');
          const data = await response.json();
          const address = data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          setFormData((prev) => ({
            ...prev,
            location: address,
          }));
        } catch (error) {
          console.error("Error fetching location string:", error);
          setFormData((prev) => ({
            ...prev,
            location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          }));
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        alert('Unable to retrieve your location. Please check your permissions.');
        setIsLocating(false);
      }
    );
  };
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setIsSubmitted(true);
  };

  return (
    <main className="create-event-page">
      <section className="create-event-card">
        <h1 className="create-event-title">Create Event</h1>
        <p className="create-event-subtitle">
          Fill in the details to publish your community event
        </p>

        <form className="create-event-form" onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="title">
            Event Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            className="field-input"
            placeholder="Enter event title"
            value={formData.title}
            onChange={handleChange}
            required
          />

          <label className="field-label" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            className="field-input field-textarea"
            placeholder="Tell people what this event is about"
            value={formData.description}
            onChange={handleChange}
            required
          />

          <div className="inline-fields">
            <div className="inline-field">
              <label className="field-label" htmlFor="date">
                Date
              </label>
              <input
                id="date"
                name="date"
                type="date"
                className="field-input"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="inline-field">
              <label className="field-label" htmlFor="time">
                Time
              </label>
              <input
                id="time"
                name="time"
                type="time"
                className="field-input"
                value={formData.time}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <label className="field-label" htmlFor="location">
            Location
          </label>
          <div className="location-input-container">
            <input
              id="location"
              name="location"
              type="text"
              className="field-input"
              placeholder="Enter event location"
              value={formData.location}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="location-btn"
              onClick={handleGetLocation}
              disabled={isLocating}
              title="Use GPS Location"
            >
              {isLocating ? (
                <span className="spinner"></span>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
                </svg>
              )}
            </button>
          </div>


          <label className="field-label" htmlFor="category">
            Category
          </label>
          <input
            id="category"
            name="category"
            type="text"
            className="field-input"
            placeholder="e.g. Music, Workshop, Sports"
            value={formData.category}
            onChange={handleChange}
            required
          />

          <button className="submit-btn" type="submit">
            Submit Event
          </button>
        </form>

        {isSubmitted && (
          <p className="success-message">
            Event submitted successfully! It is ready for review.
          </p>
        )}
      </section>
    </main>
  );
}

export default CreateEvent;
