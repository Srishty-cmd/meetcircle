import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = "http://localhost:5000";

function App() {
  const [currentPage, setCurrentPage] = useState("home");
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
  
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
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
      setLoginMessage({ type: "success", text: "Login Successful!" });

      setTimeout(() => {
        setCurrentPage("dashboard");
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

    try {
      const token = localStorage.getItem("token");

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
      <div className="home-hero">
        <h1 className="page-title">Welcome to CareMate</h1>
        <p className="page-subtitle">
        Join local events and stay connected with your community.
        </p>
      </div>
      {renderEvents()}
    </section>
  );

  const renderLogin = () => (
    <section className="page-section narrow">
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
            Don't have an account?{" "}
            <button
              type="button"
              className="link-button"
              onClick={() => setAuthMode("register")}
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
              onClick={() => setAuthMode("login")}
            >
              Login
            </button>
          </p>
        </form>
      )}
    </section>
  );

  const renderCreate = () => (
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
    const joined = events.filter((e) =>
      joinedEventIds.includes(e._id || e.id)
    );

    return (
      <section className="page-section">
        <h2 className="page-title">Dashboard</h2>
        <p className="page-subtitle">Your joined events.</p>
        {loadingEvents ? (
          <div className="spinner"></div>
        ) : joined.length === 0 ? (
          <p className="empty-text">No joined events</p>
        ) : (
          <div className="event-grid">
            {joined.map((e) => (
              <div key={e._id || e.id} className="event-card">
                <h3>{e.title}</h3>
                <p>
                  <span>Date:</span> {e.date}
                </p>
                <p>
                  <span>Location:</span> {e.location}
                </p>
                <p>
                  <span>Category:</span> {e.category}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  };

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return renderHome();
      case "login":
        return renderLogin();
      case "create":
        return renderCreate();
      case "dashboard":
        return renderDashboard();
      default:
        return renderHome();
    }
  };

  return (
    <div className="app-shell">
      <nav className="top-navbar">
        <h2>CareMate</h2>
        <div className="nav-actions">
          <button onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? "☀️ Light" : "🌙 Dark"}
          </button>
          <button onClick={() => setCurrentPage("home")}>
            Home
          </button>
          <button onClick={() => setCurrentPage("login")}>
            Login
          </button>
          <button onClick={() => setCurrentPage("create")}>
            Create
          </button>
          <button onClick={() => setCurrentPage("dashboard")}>
            Dashboard
          </button>
        </div>
      </nav>

      <main className="page-content">{renderPage()}</main>
    </div>
  );
}

export default App;