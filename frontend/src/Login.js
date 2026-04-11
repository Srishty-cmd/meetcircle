import { useState } from "react";
import { Link } from "react-router-dom";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const nextErrors = {};
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!emailPattern.test(email.trim())) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (!password.trim()) {
      nextErrors.password = "Password is required.";
    } else if (password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters.";
    }

    return nextErrors;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    setSubmitted(Object.keys(validationErrors).length === 0);
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <h1 className="login-title">Login</h1>
        <p className="login-subtitle">Welcome back to MeetCircle</p>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <label className="input-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className={`input-field ${errors.email ? "input-error" : ""}`}
            placeholder="Enter your email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          {errors.email && <p className="error-text">{errors.email}</p>}

          <label className="input-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            className={`input-field ${errors.password ? "input-error" : ""}`}
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {errors.password && <p className="error-text">{errors.password}</p>}

          <button className="login-submit-btn" type="submit">
            Login
          </button>

          {submitted && (
            <p className="success-text">Looks good! Ready to log you in.</p>
          )}
        </form>

        <p className="register-text">
          Don&apos;t have an account?{" "}
          <Link to="/login?mode=register" className="register-link">
            Register
          </Link>
        </p>
      </section>
    </main>
  );
}

export default Login;
