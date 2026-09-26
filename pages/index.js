import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Home() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error) setVideos(data);
      setLoading(false);
    };
    fetchVideos();
  }, []);

  return (
    <div style={styles.container}>
      {loading && <p style={styles.message}>Loading...</p>}
      {!loading && videos.length === 0 && (
        <p style={styles.message}>Abhi koi video nahi hai</p>
      )}
      <div style={styles.feed}>
        {videos.map((video) => (
          <div key={video.id} style={styles.videoWrapper}>
            <video
              src={video.video_url}
              controls
              playsInline
              style={styles.video}
            />
            {video.caption && (
              <p style={styles.caption}>{video.caption}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "#000",
  },
  message: {
    color: "#fff",
    textAlign: "center",
    paddingTop: "40px",
    fontFamily: "sans-serif",
  },
  feed: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  videoWrapper: {
    width: "100%",
    maxWidth: "480px",
    marginBottom: "4px",
    scrollSnapAlign: "start",
  },
  video: {
    width: "100%",
    maxHeight: "90vh",
    background: "#000",
  },
  caption: {
    color: "#fff",
    padding: "8px 12px",
    fontFamily: "sans-serif",
    margin: 0,
    background: "#111",
  },
};
