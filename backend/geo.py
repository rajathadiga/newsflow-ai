"""Reverse geocoding: turn browser GPS coordinates into a place name for "Around You".

Uses OpenStreetMap's free Nominatim service. Its usage policy asks for an identifying
User-Agent and at most ~1 request/second, so results are cached per ~1km grid cell.
"""

import requests

NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse"
HEADERS = {"User-Agent": "newsflow-ai/0.1 (learning project)"}

# (lat, lon) rounded to 2 decimals (~1km) -> place dict
_cache: dict[tuple[float, float], dict] = {}


def reverse_geocode(lat: float, lon: float) -> dict | None:
    key = (round(lat, 2), round(lon, 2))
    if key in _cache:
        return _cache[key]

    try:
        resp = requests.get(
            NOMINATIM_URL,
            # zoom=10 asks for city-level detail rather than a street address.
            params={"lat": lat, "lon": lon, "format": "jsonv2", "zoom": 10, "accept-language": "en"},
            headers=HEADERS,
            timeout=10,
        )
        resp.raise_for_status()
        address = resp.json().get("address", {})
    except requests.RequestException as e:
        print(f"[geo] reverse geocode failed for {key}: {e}")
        return None

    city = (
        address.get("city")
        or address.get("town")
        or address.get("village")
        or address.get("state_district")
        or address.get("county")
    )
    state = address.get("state")
    if not city and not state:
        return None

    place = {
        "city": city,
        "state": state,
        "country": address.get("country"),
        # What we feed to news search, e.g. "Udupi Karnataka".
        "query": " ".join(p for p in (city, state) if p),
    }
    _cache[key] = place
    return place
