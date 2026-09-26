import { useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      router.push("/admin");
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleLogin} style={styles.form}>
        <h1 style={styles.title}>ApnaTube Admin Login</h1>
        {error && <p style={styles.error}>{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
          required
        />
        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    background: "#000",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    width: "300px",
    padding: "24px",
    background: "#111",
    borderRadius: "12px",
  },
  title: {
    color: "#fff",
    fontSize: "20px",
    marginBottom: "8px",
    textAlign: "center",
  },
  input: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #333",
    background: "#222",
    color: "#fff",
    fontSize: "16px",
  },
  button: {
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    background: "#e91e63",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  error: {
    color: "#ff5252",
    fontSize: "14px",
    textAlign: "center",
  },
};
