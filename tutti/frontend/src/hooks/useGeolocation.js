import { useState, useCallback, useEffect } from "react";
import CONFIG from "../config";
import api from "../services/api";

// Wraps the browser Geolocation API and reverse-geocodes via Nominatim (free).
function useGeolocation(userId = -1) {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAbout = async () => {
      try {
        const data = await api.getAbout(userId);
        console.log(data);
        if(data.city && data.country) {
          setLocation({ city: data.city, country: data.country });
        }
      } catch (err) {
        setError(err.message);
      }
    };
    if(userId != -1) fetchAbout();
  }, [userId]);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { "User-Agent": CONFIG.MUSICBRAINZ_USER_AGENT } }
          );
          const data = await response.json();
          setLocation({
            city: data.address?.city || data.address?.town || data.address?.village || "Unknown",
            country: data.address?.country || "Unknown",
            displayName: data.display_name,
          });
        } catch {
          setLocation({ latitude, longitude, city: "Unknown", country: "Unknown" });
        }
        setLoading(false);
      },
      (err) => {
        setError(
          err.code === 1
            ? "Location permission denied. You can enable it in browser settings."
            : "Could not determine your location. Please try again."
        );
        setLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  return { location, error, loading, requestLocation };
}

export default useGeolocation;
