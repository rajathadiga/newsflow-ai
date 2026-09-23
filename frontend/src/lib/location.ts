import { reverseGeocode } from "./api";

const KEY = "outside_location";

export type SavedLocation = {
  label: string; // shown in the UI, e.g. "Udupi, Karnataka"
  query: string; // sent to news search, e.g. "Udupi Karnataka"
  source: "gps" | "manual" | "default";
};

export const DEFAULT_LOCATION: SavedLocation = {
  label: "Udupi, Karnataka",
  query: "Udupi Karnataka",
  source: "default",
};

export function loadLocation(): SavedLocation | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedLocation) : null;
  } catch {
    return null;
  }
}

export function saveLocation(loc: SavedLocation) {
  try {
    localStorage.setItem(KEY, JSON.stringify(loc));
  } catch {
    // localStorage unavailable — location just won't be remembered
  }
}

export function manualLocation(text: string): SavedLocation {
  const label = text.trim();
  return { label, query: label.replace(/,/g, " "), source: "manual" };
}

/** True if the user already allowed location access, so we can detect without a prompt. */
export async function geolocationAlreadyGranted(): Promise<boolean> {
  try {
    const status = await navigator.permissions.query({ name: "geolocation" });
    return status.state === "granted";
  } catch {
    return false;
  }
}

/** Asks the browser for GPS coordinates (may show a permission prompt), then names the place. */
export function detectLocation(): Promise<SavedLocation> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Location isn't supported in this browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const place = await reverseGeocode(coords.latitude, coords.longitude).catch(() => null);
        if (!place) {
          reject(new Error("Couldn't work out where you are."));
          return;
        }
        resolve({
          label: [place.city, place.state].filter(Boolean).join(", "),
          query: place.query,
          source: "gps",
        });
      },
      (err) =>
        reject(
          new Error(
            err.code === err.PERMISSION_DENIED
              ? "Location permission was denied."
              : "Couldn't get your location.",
          ),
        ),
      // City-level is all we need, so skip high-accuracy GPS and accept a 30-min-old fix.
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 30 * 60 * 1000 },
    );
  });
}
