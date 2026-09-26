import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function Admin() {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [recording, setRecording] = useState(false);
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.push("/login");
      } else {
        setSession(data.session);
      }
      setChecking(false);
    });
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: true,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setMessage("Camera access failed: " + err.message);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const startRecording = () => {
    if (!stream) return;
    chunksRef.current = [];
    const recorder = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp8,opus",
    });
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const recordedFile = new File([blob], `recording-${Date.now()}.webm`, {
        type: "video/webm",
      });
      setFile(recordedFile);
      stopCamera();
    };
    mediaRecorderRef.current = recorder;
    recorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Pehle video select ya record karo");
      return;
    }
    setUploading(true);
    setMessage("Uploading...");

    try {
      const signRes = await fetch("/api/sign-upload", { method: "POST" });
      const signData = await signRes.json();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", signData.apiKey);
      formData.append("timestamp", signData.timestamp);
      formData.append("signature", signData.signature);
      formData.append("folder", signData.folder);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${signData.cloudName}/video/upload`,
        {
          method: "POST",
          body: formData,
        }
      );
      const uploadData = await uploadRes.json();

      if (!uploadData.secure_url) {
        throw new Error("Cloudinary upload failed");
      }

      const { error } = await supabase.from("videos").insert({
        video_url: uploadData.secure_url,
        caption: caption,
        cloudinary_public_id: uploadData.public_id,
      });

      if (error) throw error;

      setMessage("Video upload ho gayi!");
      setFile(null);
      setCaption("");
    } catch (err) {
      setMessage("Error: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  if (checking) return <p style={{ color: "#fff" }}>Loading...</p>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>ApnaTube Admin</h1>
        <button onClick={handleLogout} style={styles.logoutBtn}>
          Logout
        </button>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Option 1: File se upload karo</h2>
        <input
          type="file"
          accept="video/*"
          onChange={(e) => setFile(e.target.files[0])}
          style={styles.fileInput}
        />
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Option 2: Camera se record karo</h2>
        {!stream && !recording && (
          <button onClick={startCamera} style={styles.actionBtn}>
            Camera Kholo
          </button>
        )}
        {stream && (
          <div>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              style={styles.video}
            />
            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
              {!recording ? (
                <button onClick={startRecording} style={styles.recordBtn}>
                  ● Record Start
                </button>
              ) : (
                <button onClick={stopRecording} style={styles.stopBtn}>
                  ■ Record Stop
                </button>
              )}
              <button onClick={stopCamera} style={styles.cancelBtn}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {file && (
        <div style={styles.card}>
          <p style={{ color: "#0f0" }}>Video ready: {file.name}</p>
          <input
            type="text"
            placeholder="Caption likho (optional)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            style={styles.captionInput}
          />
          <button
            onClick={handleUpload}
            disabled={uploading}
            style={styles.uploadBtn}
          >
            {uploading ? "Uploading..." : "Upload Karo"}
          </button>
        </div>
      )}

      {message && <p style={styles.message}>{message}</p>}
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "#000",
    padding: "16px",
    fontFamily: "sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  title: { color: "#fff", fontSize: "22px" },
  logoutBtn: {
    background: "#333",
    color: "#fff",
    border: "none",
    padding: "8px 16px",
    borderRadius: "8px",
  },
  card: {
    background: "#111",
    padding: "16px",
    borderRadius: "12px",
    marginBottom: "16px",
  },
  sectionTitle: { color: "#fff", fontSize: "16px", marginBottom: "10px" },
  fileInput: { color: "#fff" },
  actionBtn: {
    background: "#2196f3",
    color: "#fff",
    border: "none",
    padding: "12px 20px",
    borderRadius: "8px",
    fontSize: "15px",
  },
  video: {
    width: "100%",
    borderRadius: "8px",
    background: "#000",
  },
  recordBtn: {
    flex: 1,
    background: "#e91e63",
    color: "#fff",
    border: "none",
    padding: "12px",
    borderRadius: "8px",
  },
  stopBtn: {
    flex: 1,
    background: "#555",
    color: "#fff",
    border: "none",
    padding: "12px",
    borderRadius: "8px",
  },
  cancelBtn: {
    background: "#333",
    color: "#fff",
    border: "none",
    padding: "12px",
    borderRadius: "8px",
  },
  captionInput: {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #333",
    background: "#222",
    color: "#fff",
    marginBottom: "10px",
    boxSizing: "border-box",
  },
  uploadBtn: {
    width: "100%",
    background: "#4caf50",
    color: "#fff",
    border: "none",
    padding: "14px",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "bold",
  },
  message: { color: "#fff", textAlign: "center" },
};
