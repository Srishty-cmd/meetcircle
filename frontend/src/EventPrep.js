import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./EventPrep.css";

function buildInitialUserMessage(eventName, eventDetails) {
  const details = (eventDetails || "").trim();
  return `Event name: ${eventName.trim()}\n\nOrganizer details / context:\n${details || "(none provided)"}\n\nProduce the full event prep package as specified in your system instructions.`;
}

function EventPrep({ apiBase, getToken, getErrorMessage, onNavigateLogin }) {
  const [eventName, setEventName] = useState("");
  const [eventDetails, setEventDetails] = useState("");
  const [thread, setThread] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [demoMode, setDemoMode] = useState(false);
  const [savedPreps, setSavedPreps] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [expandedSavedId, setExpandedSavedId] = useState(null);
  const [linkedEventId, setLinkedEventId] = useState("");
  const [myEvents, setMyEvents] = useState([]);

  const authHeaders = () => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadSaved = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setSavedPreps([]);
      setLoadingSaved(false);
      return;
    }
    try {
      const res = await axios.get(`${apiBase}/api/event-prep/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSavedPreps(res.data || []);
    } catch {
      setSavedPreps([]);
    } finally {
      setLoadingSaved(false);
    }
  }, [apiBase, getToken]);

  const loadMyEvents = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await axios.get(`${apiBase}/api/events/my-events`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMyEvents(res.data || []);
    } catch {
      setMyEvents([]);
    }
  }, [apiBase, getToken]);

  useEffect(() => {
    loadSaved();
    loadMyEvents();
  }, [loadSaved, loadMyEvents]);

  const lastAssistantBlueprint = () => {
    for (let i = thread.length - 1; i >= 0; i--) {
      if (thread[i].role === "assistant") return thread[i].content;
    }
    return "";
  };

  const handleGenerate = async () => {
    const token = getToken();
    if (!token) {
      onNavigateLogin();
      return;
    }
    if (!eventName.trim()) {
      setError("Enter an event name first.");
      return;
    }
    setError(null);
    setLoading(true);
    setDemoMode(false);
    try {
      const res = await axios.post(
        `${apiBase}/api/event-prep/chat`,
        {
          eventName: eventName.trim(),
          eventDetails: eventDetails,
          messages: [],
        },
        { headers: authHeaders() }
      );
      const reply = res.data.reply;
      if (res.data.demo) setDemoMode(true);
      const initialUser = buildInitialUserMessage(eventName, eventDetails);
      setThread([
        { role: "user", content: initialUser },
        { role: "assistant", content: reply },
      ]);
    } catch (err) {
      setError(getErrorMessage(err, "Could not reach the AI assistant."));
    } finally {
      setLoading(false);
    }
  };

  const handleSendFollowUp = async () => {
    const token = getToken();
    if (!token) {
      onNavigateLogin();
      return;
    }
    if (!chatInput.trim()) return;
    if (thread.length === 0) {
      setError("Generate a blueprint first.");
      return;
    }
    setError(null);
    setLoading(true);
    const nextThread = [
      ...thread,
      { role: "user", content: chatInput.trim() },
    ];
    setChatInput("");
    try {
      const res = await axios.post(
        `${apiBase}/api/event-prep/chat`,
        {
          eventName: eventName.trim(),
          eventDetails: eventDetails,
          messages: nextThread,
        },
        { headers: authHeaders() }
      );
      const reply = res.data.reply;
      if (res.data.demo) setDemoMode(true);
      setThread([...nextThread, { role: "assistant", content: reply }]);
    } catch (err) {
      setError(getErrorMessage(err, "Follow-up failed."));
      setChatInput(nextThread[nextThread.length - 1].content);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrep = async () => {
    const token = getToken();
    if (!token) {
      onNavigateLogin();
      return;
    }
    const blueprint = lastAssistantBlueprint();
    if (!eventName.trim() || !blueprint) {
      setError("Generate a blueprint before saving.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await axios.post(
        `${apiBase}/api/event-prep/save`,
        {
          title: eventName.trim(),
          details: eventDetails,
          blueprint,
          linkedEventId: linkedEventId || undefined,
        },
        { headers: authHeaders() }
      );
      await loadSaved();
    } catch (err) {
      setError(getErrorMessage(err, "Could not save prep."));
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePrep = async (id) => {
    const token = getToken();
    if (!token) return;
    if (!window.confirm("Delete this saved prep?")) return;
    try {
      await axios.delete(`${apiBase}/api/event-prep/${id}`, {
        headers: authHeaders(),
      });
      setExpandedSavedId(null);
      await loadSaved();
    } catch (err) {
      setError(getErrorMessage(err, "Delete failed."));
    }
  };

  const tokenPresent = Boolean(getToken());

  return (
    <section className="event-prep-page">
      <div className="event-prep-header">
        <h2 className="page-title">Event Prep</h2>
        <p className="page-subtitle">
          Describe your event; the AI assistant builds requirements, timelines,
          and a full blueprint. Save it to your library for this event or
          future use.
        </p>
      </div>

      {!tokenPresent && (
        <div className="alert-error event-prep-banner">
          Log in to use the AI assistant and save preps.{" "}
          <button type="button" className="link-button" onClick={onNavigateLogin}>
            Go to Login
          </button>
        </div>
      )}

      {demoMode && tokenPresent && (
        <div className="alert-success event-prep-banner">
          Demo blueprint (no API key). Add{" "}
          <code className="event-prep-code">OPENAI_API_KEY</code> to backend{" "}
          <code className="event-prep-code">.env</code> for live AI output.
        </div>
      )}

      {error && (
        <div className="alert-error event-prep-banner" role="alert">
          {error}
        </div>
      )}

      <div className="event-prep-layout">
        <div className="event-prep-panel">
          <h3 className="event-prep-panel-title">Event context</h3>
          <label htmlFor="prep-event-name">Event name</label>
          <input
            id="prep-event-name"
            type="text"
            placeholder="e.g. Spring Community Hackathon"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            disabled={!tokenPresent}
          />
          <label htmlFor="prep-event-details">Details & goals</label>
          <textarea
            id="prep-event-details"
            placeholder="Audience, size, theme, constraints, partners, date range…"
            value={eventDetails}
            onChange={(e) => setEventDetails(e.target.value)}
            disabled={!tokenPresent}
            rows={5}
          />
          <button
            type="button"
            className="event-prep-primary"
            onClick={handleGenerate}
            disabled={!tokenPresent || loading}
          >
            {loading ? "Working…" : "Generate blueprint with AI"}
          </button>

          <label htmlFor="prep-link-event" className="event-prep-link-label">
            Link to your event (optional)
          </label>
          <select
            id="prep-link-event"
            value={linkedEventId}
            onChange={(e) => setLinkedEventId(e.target.value)}
            disabled={!tokenPresent}
          >
            <option value="">— None —</option>
            {myEvents.map((ev) => (
              <option key={ev._id} value={ev._id}>
                {ev.title}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="event-prep-secondary"
            onClick={handleSavePrep}
            disabled={!tokenPresent || saving || !lastAssistantBlueprint()}
          >
            {saving ? "Saving…" : "Save to Event Prep library"}
          </button>
        </div>

        <div className="event-prep-chat">
          <h3 className="event-prep-panel-title">AI assistant</h3>
          <div className="event-prep-messages" aria-live="polite">
            {thread.length === 0 && (
              <p className="event-prep-placeholder">
                Fill in event name and details, then generate a blueprint. You
                can ask follow-up questions below.
              </p>
            )}
            {thread.map((m, i) => (
              <div
                key={i}
                className={`event-prep-msg event-prep-msg--${m.role}`}
              >
                <span className="event-prep-msg-label">
                  {m.role === "user" ? "You" : "Assistant"}
                </span>
                <div className="event-prep-msg-body">{m.content}</div>
              </div>
            ))}
          </div>
          <div className="event-prep-followup">
            <textarea
              placeholder="Ask a follow-up (e.g. add a sponsor plan, tighten day-of schedule)…"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={!tokenPresent || loading || thread.length === 0}
              rows={3}
            />
            <button
              type="button"
              className="event-prep-primary"
              onClick={handleSendFollowUp}
              disabled={
                !tokenPresent || loading || !chatInput.trim() || thread.length === 0
              }
            >
              Send
            </button>
          </div>
        </div>
      </div>

      <div className="event-prep-saved">
        <h3 className="event-prep-panel-title">Your saved event preps</h3>
        {!tokenPresent ? (
          <p className="empty-text">Log in to see saved preps.</p>
        ) : loadingSaved ? (
          <div className="spinner" />
        ) : savedPreps.length === 0 ? (
          <p className="empty-text">No saved preps yet.</p>
        ) : (
          <ul className="event-prep-saved-list">
            {savedPreps.map((p) => (
              <li key={p._id} className="event-prep-saved-card">
                <div className="event-prep-saved-row">
                  <button
                    type="button"
                    className="event-prep-saved-toggle"
                    onClick={() =>
                      setExpandedSavedId((id) =>
                        id === p._id ? null : p._id
                      )
                    }
                  >
                    {expandedSavedId === p._id ? "▼" : "▶"}{" "}
                    <strong>{p.title}</strong>
                    <span className="event-prep-saved-date">
                      {new Date(p.updatedAt).toLocaleString()}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="event-prep-delete"
                    onClick={() => handleDeletePrep(p._id)}
                    aria-label="Delete prep"
                  >
                    Delete
                  </button>
                </div>
                {p.linkedEvent && (
                  <p className="event-prep-linked">
                    Linked: {p.linkedEvent.title || "Event"}
                  </p>
                )}
                {expandedSavedId === p._id && (
                  <div className="event-prep-saved-body">
                    <p className="event-prep-saved-details-label">Your notes</p>
                    <p className="event-prep-saved-details">{p.details || "—"}</p>
                    <p className="event-prep-saved-details-label">Blueprint</p>
                    <div className="event-prep-msg-body event-prep-saved-blueprint">
                      {p.blueprint}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default EventPrep;
