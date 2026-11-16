// Set up the map, centered on the Philippines
const map = L.map("map").setView([12.8797, 121.774], 6);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

// A layer group makes it easy to clear all markers at once
const markers = L.layerGroup().addTo(map);

const form = document.getElementById("search-form");
const input = document.getElementById("query");
const button = document.getElementById("search-btn");
const message = document.getElementById("message");

function showMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle("error", isError);
}

// Escape text before putting it in popup HTML
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

async function searchCity(query) {
  // countrycodes=ph limits results to the Philippines; limit=5 caps the results
  const url = "https://nominatim.openstreetmap.org/search" +
    "?format=jsonv2&addressdetails=1&limit=5&countrycodes=ph" +
    "&q=" + encodeURIComponent(query);

  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new Error("The search service returned status " + response.status + ".");
  }
  return response.json();
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const query = input.value.trim();

  // Clear old markers before every new search
  markers.clearLayers();

  if (!query) {
    showMessage("Enter a city name before searching.", true);
    return;
  }

  button.disabled = true;
  showMessage("Searching for “" + query + "”…");

  try {
    const results = await searchCity(query);

    // No results message
    if (results.length === 0) {
      showMessage("No Philippine places found for “" + query + "”. Check the spelling or try a nearby city.", true);
      return;
    }

    // Add up to five markers with name + country in each popup
    const bounds = [];
    results.slice(0, 5).forEach((place) => {
      const lat = parseFloat(place.lat);
      const lon = parseFloat(place.lon);
      const name = place.name || place.display_name.split(",")[0];
      const country = (place.address && place.address.country) || "Philippines";

      L.marker([lat, lon])
        .addTo(markers)
        .bindPopup("<strong>" + escapeHtml(name) + "</strong><br>" + escapeHtml(country));

      bounds.push([lat, lon]);
    });

    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    showMessage("Showing " + bounds.length + " match" + (bounds.length > 1 ? "es" : "") + " for “" + query + "”. Click a marker for details.");
  } catch (err) {
    // Error message
    showMessage("Search failed: " + err.message + " Check your internet connection and try again.", true);
  } finally {
    button.disabled = false;
  }
});