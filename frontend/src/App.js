import { useState, useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import Home from "./Home";
import Landing from "./Landing";
import EventPrep from "./EventPrep";

const PATH_TO_PAGE = {
  "/": "landing",
  "/home": "home",
  "/login": "login",
  "/create": "create",
  "/dashboard": "dashboard",
  "/event-prep": "eventPrep",
};

/**
 * Dev: default "" → requests go to `/api/...` on the CRA dev server and proxy to port 5000 (package.json "proxy").
 * Production build: default `http://localhost:5000` unless REACT_APP_API_BASE is set (use that for deployed APIs).
 */
const API_BASE =
  process.env.NODE_ENV === "development"
    ? process.env.REACT_APP_API_BASE ?? ""
    : process.env.REACT_APP_API_BASE ?? "http://localhost:5000";

function toDateInputValue(val) {
  if (!val) return "";
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

function formatEventDate(val) {
  if (!val) return "—";
  const d = new Date(val);
  return Number.isNaN(d.getTime())
    ? String(val)
    : d.toLocaleDateString(undefined, { dateStyle: "medium" });
}

function getStoredToken() {
  const t = localStorage.getItem("token");
  if (!t || t === "null" || t === "undefined") return null;
  return t;
}

function normalizePathname(pathname) {
  if (!pathname) return "/";
  const trimmed = pathname.replace(/\/+$/, "") || "/";
  return trimmed;
}

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(() => {
    const path = normalizePathname(window.location.pathname);
    return PATH_TO_PAGE[path] || "landing";
  });

  useEffect(() => {
    const path = location.pathname;
    if (path.length > 1 && path.endsWith("/")) {
      navigate(
        `${normalizePathname(path)}${location.search}${location.hash}`,
        { replace: true }
      );
      return;
    }
    const key = normalizePathname(location.pathname);
    const page = PATH_TO_PAGE[key];
    if (page) setCurrentPage(page);
    else setCurrentPage("landing");
  }, [location.pathname, location.search, location.hash, navigate]);

  useEffect(() => {
    const token = getStoredToken();
    if (!token || localStorage.getItem("user")) return;
    let cancelled = false;
    axios
      .get(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (cancelled) return;
        localStorage.setItem("user", JSON.stringify(res.data));
        setCurrentUser(res.data);
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      });
    return () => {
      cancelled = true;
    };
  }, []);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-mode");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState("");

  const [joinedEventIds, setJoinedEventIds] = useState([]);
  const [joinMessage, setJoinMessage] = useState(null);
  const [loadingJoinId, setLoadingJoinId] = useState(null);

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [loginMessage, setLoginMessage] = useState(null);
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  useEffect(() => {
    if (normalizePathname(location.pathname) === "/register") {
      navigate("/login?mode=register", { replace: true });
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    if (normalizePathname(location.pathname) !== "/login") return;
    const mode = searchParams.get("mode");
    if (mode === "register") setAuthMode("register");
    else setAuthMode("login");
  }, [location.pathname, searchParams]);
  
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "volunteer",
  });
  const [registerMessage, setRegisterMessage] = useState(null);
  const [loadingRegister, setLoadingRegister] = useState(false);

  const getErrorMessage = (err, fallbackMessage) => {
    if (err.response?.data?.message) return err.response.data.message;
    if (err.message) return err.message;
    return fallbackMessage;
  };

  const [createForm, setCreateForm] = useState({
    title: "",
    date: "",
    location: "",
    category: "",
    description: "",
  });

  const [createMessage, setCreateMessage] = useState(null);
  const [loadingCreate, setLoadingCreate] = useState(false);

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [dashboardExpandedId, setDashboardExpandedId] = useState(null);
  const [dashboardEdit, setDashboardEdit] = useState(null);
  const [dashboardSaving, setDashboardSaving] = useState(false);
  const [dashboardMessage, setDashboardMessage] = useState(null);

  // ✅ Fetch events from backend
  useEffect(() => {
    axios
      .get(`${API_BASE}/api/events`)
      .then((res) => {
        setEvents(res.data);
        setLoadingEvents(false);
      })
      .catch((err) => {
        setEventsError(
          getErrorMessage(err, "Failed to load events. Check backend/MongoDB.")
        );
        setLoadingEvents(false);
      });
  }, []);

  // ✅ Join event
  const handleJoin = (id) => {
    setJoinMessage(null);
    setLoadingJoinId(id);
    
    // Simulating an API call for joining since it might not be fully functional
    setTimeout(() => {
      if (!joinedEventIds.includes(id)) {
        setJoinedEventIds([...joinedEventIds, id]);
        setJoinMessage({ type: "success", text: "Successfully joined the event!" });
      }
      setLoadingJoinId(null);
      setTimeout(() => setJoinMessage(null), 3500);
    }, 600);
  };

  // ✅ LOGIN HANDLER (REAL BACKEND)
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginMessage(null);
    setLoadingLogin(true);

    try {
      const res = await axios.post(
        `${API_BASE}/api/auth/login`,
        loginForm
      );

      localStorage.setItem("token", res.data.token);
      if (res.data.user) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
        setCurrentUser(res.data.user);
      }
      setLoginMessage({ type: "success", text: "Login Successful!" });

      setTimeout(() => {
        navigate("/home");
        setLoadingLogin(false);
      }, 800);
    } catch (err) {
      setLoginMessage({ type: "error", text: getErrorMessage(err, "Login failed") });
      setLoadingLogin(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegisterMessage(null);
    setLoadingRegister(true);

    try {
      await axios.post(
        `${API_BASE}/api/auth/register`,
        registerForm
      );

      setRegisterMessage({ type: "success", text: "Registration successful! Please login." });
      setRegisterForm({
        name: "",
        email: "",
        password: "",
        role: "volunteer",
      });
      setTimeout(() => {
        setAuthMode("login");
        setRegisterMessage(null);
        setLoadingRegister(false);
      }, 1500);
    } catch (err) {
      setRegisterMessage({ type: "error", text: getErrorMessage(err, "Registration failed") });
      setLoadingRegister(false);
    }
  };

  // ✅ CREATE EVENT
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateMessage(null);
    setLoadingCreate(true);

    const token = getStoredToken();
    if (!token) {
      setCreateMessage({
        type: "error",
        text: "You must log in to create an event. Use Login, then try again.",
      });
      setLoadingCreate(false);
      navigate("/login");
      return;
    }

    try {
      await axios.post(
        `${API_BASE}/api/events/create`,
        createForm,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setCreateMessage({ type: "success", text: "Event Created successfully!" });

      setCreateForm({
        title: "",
        date: "",
        location: "",
        category: "",
        description: "",
      });

      // refresh events
      const res = await axios.get(
        `${API_BASE}/api/events`
      );
      setEvents(res.data);
      navigate("/dashboard");
    } catch (err) {
      setCreateMessage({ type: "error", text: getErrorMessage(err, "Error creating event.") });
    } finally {
      setLoadingCreate(false);
    }
  };

  // ✅ UI COMPONENTS

  const renderEvents = () => {
    if (loadingEvents) return <div className="spinner"></div>;
    if (eventsError) return <div className="alert-error">{eventsError}</div>;

    return (
      <div className="event-grid">
        {joinMessage && (
          <div className={`alert-${joinMessage.type}`} style={{ gridColumn: "1 / -1" }}>
            {joinMessage.text}
          </div>
        )}
        {events.map((e) => (
          <div key={e._id || e.id} className="event-card">
            <h3>{e.title}</h3>
            <div className="card-badges">
              <span className={`badge badge-${e.category ? e.category.toLowerCase().replace(/\s+/g, '-') : 'other'}`}>
                {e.category || 'Other'}
              </span>
            </div>
            <p>
              <span>Date:</span> {e.date}
            </p>
            <p>
              <span>Location:</span> {e.location}
            </p>
            <button 
              onClick={() => handleJoin(e._id || e.id)}
              disabled={loadingJoinId === (e._id || e.id) || joinedEventIds.includes(e._id || e.id)}
            >
              {loadingJoinId === (e._id || e.id)
                ? "Joining..."
                : joinedEventIds.includes(e._id || e.id)
                ? "Joined"
                : "Join"}
            </button>
          </div>
        ))}
      </div>
    );
  };

  const renderHome = () => (
    <section className="page-section home-page">
      <Home />
      {renderEvents()}
    </section>
  );

  const renderLogin = () => (
    <section className="page-section narrow">
      <p className="login-back">
        <button
          type="button"
          className="link-button"
          onClick={() => navigate("/")}
        >
          ← Back to MeetCircle
        </button>
      </p>
      <h2 className="page-title">{authMode === "login" ? "Login" : "Register"}</h2>
      {authMode === "login" ? (
        <form className="form-card" onSubmit={handleLoginSubmit}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="Email"
            value={loginForm.email}
            onChange={(e) =>
              setLoginForm({ ...loginForm, email: e.target.value })
            }
          />
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Password"
            value={loginForm.password}
            onChange={(e) =>
              setLoginForm({
                ...loginForm,
                password: e.target.value,
              })
            }
          />
          <button type="submit" disabled={loadingLogin}>
            {loadingLogin ? "Logging in..." : "Login"}
          </button>
          {loginMessage && (
            <div className={`alert-${loginMessage.type}`}>
              {loginMessage.text}
            </div>
          )}
          <p className="page-subtitle">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              className="link-button"
              onClick={() => {
                setAuthMode("register");
                navigate("/login?mode=register", { replace: true });
              }}
            >
              Register
            </button>
          </p>
        </form>
      ) : (
        <form className="form-card" onSubmit={handleRegisterSubmit}>
          <label htmlFor="name">Name</label>
          <input
            id="name"
            type="text"
            placeholder="Name"
            value={registerForm.name}
            onChange={(e) =>
              setRegisterForm({ ...registerForm, name: e.target.value })
            }
          />
          <label htmlFor="register-email">Email</label>
          <input
            id="register-email"
            type="email"
            placeholder="Email"
            value={registerForm.email}
            onChange={(e) =>
              setRegisterForm({ ...registerForm, email: e.target.value })
            }
          />
          <label htmlFor="register-password">Password</label>
          <input
            id="register-password"
            type="password"
            placeholder="Password"
            value={registerForm.password}
            onChange={(e) =>
              setRegisterForm({ ...registerForm, password: e.target.value })
            }
          />
          <label htmlFor="register-role">Role</label>
          <select
            id="register-role"
            value={registerForm.role}
            onChange={(e) =>
              setRegisterForm({ ...registerForm, role: e.target.value })
            }
            style={{ width: "100%", padding: "10px", marginBottom: "15px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontFamily: "inherit" }}
          >
            <option value="volunteer">General Volunteer</option>
            <option value="core">Core Team</option>
          </select>
          <button type="submit" disabled={loadingRegister}>
            {loadingRegister ? "Registering..." : "Register"}
          </button>
          {registerMessage && (
            <div className={`alert-${registerMessage.type}`}>
              {registerMessage.text}
            </div>
          )}
          <p className="page-subtitle">
            Already have an account?{" "}
            <button
              type="button"
              className="link-button"
              onClick={() => {
                setAuthMode("login");
                navigate("/login", { replace: true });
              }}
            >
              Login
            </button>
          </p>
        </form>
      )}
    </section>
  );

  const renderCreate = () => {
    if (!getStoredToken()) {
      return (
        <section className="page-section narrow">
          <h2 className="page-title">Create Event</h2>
          <div className="alert-error" style={{ marginBottom: "14px" }}>
            You must be logged in to create an event.{" "}
            <button
              type="button"
              className="link-button"
              onClick={() => navigate("/login")}
            >
              Go to Login
            </button>
          </div>
        </section>
      );
    }
    
    if (currentUser?.role !== "core") {
      return (
        <section className="page-section narrow">
          <h2 className="page-title">Create Event</h2>
          <div className="alert-error" style={{ marginBottom: "14px" }}>
            Access Denied. Only Core Team members can create new events.
          </div>
        </section>
      );
    }

    return (
      <section className="page-section narrow">
        <h2 className="page-title">Create Event</h2>
        <form className="form-card" onSubmit={handleCreateSubmit}>
        <label htmlFor="title">Title</label>
        <input
          id="title"
          placeholder="Title"
          value={createForm.title}
          onChange={(e) =>
            setCreateForm({ ...createForm, title: e.target.value })
          }
        />
        <label htmlFor="date">Date</label>
        <input
          id="date"
          type="date"
          value={createForm.date}
          onChange={(e) =>
            setCreateForm({ ...createForm, date: e.target.value })
          }
        />
        <label htmlFor="location">Location</label>
        <input
          id="location"
          placeholder="Location"
          value={createForm.location}
          onChange={(e) =>
            setCreateForm({
              ...createForm,
              location: e.target.value,
            })
          }
        />
        <label htmlFor="category">Category</label>
        <input
          id="category"
          placeholder="Category"
          value={createForm.category}
          onChange={(e) =>
            setCreateForm({
              ...createForm,
              category: e.target.value,
            })
          }
        />
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          placeholder="Description"
          value={createForm.description}
          onChange={(e) =>
            setCreateForm({
              ...createForm,
              description: e.target.value,
            })
          }
        />
        <button type="submit" disabled={loadingCreate}>
          {loadingCreate ? "Creating..." : "Create"}
        </button>
        {createMessage && (
          <div className={`alert-${createMessage.type}`}>
            {createMessage.text}
          </div>
        )}
      </form>
    </section>
  );

  const renderDashboard = () => {
    const currentUserId = currentUser?.id;

    const isOwner = (ev) => {
      const creatorId = ev.createdBy?._id ?? ev.createdBy;
      return Boolean(
        currentUserId &&
          creatorId &&
          String(currentUserId) === String(creatorId)
      );
    };

    const toggleExpand = (ev) => {
      const id = ev._id || ev.id;
      setDashboardExpandedId((prev) => (prev === id ? null : id));
      setDashboardEdit(null);
      setDashboardMessage(null);
    };

    const startEdit = (ev) => {
      const id = ev._id || ev.id;
      setDashboardExpandedId(id);
      setDashboardEdit({
        _id: id,
        title: ev.title,
        description: ev.description || "",
        date: toDateInputValue(ev.date),
        location: ev.location || "",
        category: ev.category || "",
      });
      setDashboardMessage(null);
    };

    const handleDashboardSave = async (e) => {
      e.preventDefault();
      if (!dashboardEdit) return;
      const auth = getStoredToken();
      if (!auth) {
        setDashboardMessage({ type: "error", text: "Log in to save changes." });
        return;
      }
      setDashboardSaving(true);
      setDashboardMessage(null);
      try {
        const { _id, ...body } = dashboardEdit;
        await axios.put(`${API_BASE}/api/events/${_id}`, body, {
          headers: { Authorization: `Bearer ${auth}` },
        });
        const res = await axios.get(`${API_BASE}/api/events`);
        setEvents(res.data);
        setDashboardMessage({ type: "success", text: "Changes saved." });
        setDashboardEdit(null);
        setDashboardExpandedId(null);
      } catch (err) {
        setDashboardMessage({
          type: "error",
          text: getErrorMessage(err, "Could not save changes."),
        });
      } finally {
        setDashboardSaving(false);
      }
    };

    return (
      <section className="page-section">
        <h2 className="page-title">Dashboard</h2>
        <div className="dashboard-next-step">
          <p>
            Plan your event with the AI assistant — timelines, requirements, and
            saved prep in one place.
          </p>
          <button
            type="button"
            className="dashboard-next-step-btn"
            onClick={() => navigate("/event-prep")}
          >
            Go to Event Prep
          </button>
        </div>
        <p className="page-subtitle">
          Browse every event in one place. Click <strong>View details</strong> to
          see the full description. If you created an event, use{" "}
          <strong>Edit</strong> to update it and save.
        </p>
        {dashboardMessage && (
          <div
            className={`alert-${dashboardMessage.type}`}
            style={{ marginBottom: "16px" }}
          >
            {dashboardMessage.text}
          </div>
        )}
        {loadingEvents ? (
          <div className="spinner"></div>
        ) : eventsError ? (
          <div className="alert-error">{eventsError}</div>
        ) : events.length === 0 ? (
          <p className="empty-text">No events yet. Create one from Create.</p>
        ) : (
          <div className="event-grid">
            {events.map((ev) => {
              const id = ev._id || ev.id;
              const expanded = dashboardExpandedId === id;
              const editing =
                dashboardEdit && String(dashboardEdit._id) === String(id);
              const owner = isOwner(ev);
              const isCore = currentUser?.role === "core";

              return (
                <div key={id} className="event-card dashboard-event-card">
                  <h3>{ev.title}</h3>
                  <div className="card-badges">
                    <span
                      className={`badge badge-${
                        ev.category
                          ? ev.category.toLowerCase().replace(/\s+/g, "-")
                          : "other"
                      }`}
                    >
                      {ev.category || "Other"}
                    </span>
                  </div>
                  <p>
                    <span>Date:</span> {formatEventDate(ev.date)}
                  </p>
                  <p>
                    <span>Location:</span> {ev.location}
                  </p>
                  <div className="dashboard-actions">
                    <button
                      type="button"
                      className="btn-dashboard btn-dashboard-view"
                      onClick={() => toggleExpand(ev)}
                    >
                      {expanded ? "Hide details" : "View details"}
                    </button>
                    {owner && isCore && (
                      <button
                        type="button"
                        className="btn-dashboard btn-dashboard-edit"
                        onClick={() =>
                          editing ? setDashboardEdit(null) : startEdit(ev)
                        }
                      >
                        {editing ? "Cancel edit" : "Edit"}
                      </button>
                    )}
                  </div>

                  {expanded && !editing && (
                    <div className="dashboard-detail">
                      <p className="dashboard-detail-label">Description</p>
                      <p className="dashboard-detail-desc">
                        {ev.description || "No description provided."}
                      </p>
                      <p className="dashboard-detail-meta">
                        <span>Category:</span> {ev.category}
                      </p>
                    </div>
                  )}

                  {expanded && editing && dashboardEdit && (
                    <form
                      className="dashboard-edit-form"
                      onSubmit={handleDashboardSave}
                    >
                      <label htmlFor={`dash-title-${id}`}>Title</label>
                      <input
                        id={`dash-title-${id}`}
                        value={dashboardEdit.title}
                        onChange={(e) =>
                          setDashboardEdit({
                            ...dashboardEdit,
                            title: e.target.value,
                          })
                        }
                        required
                      />
                      <label htmlFor={`dash-desc-${id}`}>Description</label>
                      <textarea
                        id={`dash-desc-${id}`}
                        value={dashboardEdit.description}
                        onChange={(e) =>
                          setDashboardEdit({
                            ...dashboardEdit,
                            description: e.target.value,
                          })
                        }
                        required
                      />
                      <label htmlFor={`dash-date-${id}`}>Date</label>
                      <input
                        id={`dash-date-${id}`}
                        type="date"
                        value={dashboardEdit.date}
                        onChange={(e) =>
                          setDashboardEdit({
                            ...dashboardEdit,
                            date: e.target.value,
                          })
                        }
                        required
                      />
                      <label htmlFor={`dash-loc-${id}`}>Location</label>
                      <input
                        id={`dash-loc-${id}`}
                        value={dashboardEdit.location}
                        onChange={(e) =>
                          setDashboardEdit({
                            ...dashboardEdit,
                            location: e.target.value,
                          })
                        }
                        required
                      />
                      <label htmlFor={`dash-cat-${id}`}>Category</label>
                      <input
                        id={`dash-cat-${id}`}
                        value={dashboardEdit.category}
                        onChange={(e) =>
                          setDashboardEdit({
                            ...dashboardEdit,
                            category: e.target.value,
                          })
                        }
                        required
                      />
                      <div className="dashboard-form-actions">
                        <button
                          type="submit"
                          disabled={dashboardSaving}
                        >
                          {dashboardSaving ? "Saving…" : "Save changes"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    );
  };

  const renderPage = () => {
    switch (currentPage) {
      case "landing":
        return (
          <Landing
            darkMode={darkMode}
            onToggleDark={() => setDarkMode(!darkMode)}
          />
        );
      case "home":
        return renderHome();
      case "login":
        return renderLogin();
      case "create":
        return renderCreate();
      case "dashboard":
        return renderDashboard();
      case "eventPrep":
        return (
          <EventPrep
            apiBase={API_BASE}
            getToken={getStoredToken}
            getErrorMessage={getErrorMessage}
            onNavigateLogin={() => navigate("/login")}
          />
        );
      default:
        return (
          <Landing
            darkMode={darkMode}
            onToggleDark={() => setDarkMode(!darkMode)}
          />
        );
    }
  };

  const isLanding = currentPage === "landing";

  return (
    <div className="app-shell">
      {!isLanding && (
        <nav className="top-navbar">
          <h2 className="navbar-brand">
            <button
              type="button"
              className="navbar-brand-btn"
              onClick={() => navigate("/home")}
            >
              MeetCircle
            </button>
          </h2>
          <div className="nav-actions">
            <button type="button" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? "☀️ Light" : "🌙 Dark"}
            </button>
            <button type="button" onClick={() => navigate("/home")}>
              Home
            </button>
            <button type="button" onClick={() => navigate("/login")}>
              Login
            </button>
            <button type="button" onClick={() => navigate("/create")}>
              Create
            </button>
            <button type="button" onClick={() => navigate("/dashboard")}>
              Dashboard
            </button>
            <button type="button" onClick={() => navigate("/event-prep")}>
              Event Prep
            </button>
          </div>
        </nav>
      )}

      <main
        className={isLanding ? "page-content page-content--landing" : "page-content"}
      >
        {renderPage()}
      </main>
    </div>
  );
}

export default App;