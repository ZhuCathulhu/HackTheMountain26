const FILTERS = {
  genre:    ["dance", "instrumental", "theatre"],
  level:    ["no experience", "beginner", "novice", "intermediate", "pro"],
  location: ["indoors", "outdoors", "venue"],
  uniform:  ["no uniform", "uniform provided", "uniform required"],
};

const active = {};
Object.keys(FILTERS).forEach(k => { active[k] = new Set(FILTERS[k]); });

let roles     = [];
let nextId    = 1;
let activeId  = null;
let searchVal = "";

// ── Map ──

const map = L.map("map");
map.zoomControl.remove();

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

map.setView([45.530, -73.620], 11);

navigator.geolocation.getCurrentPosition(
  ({ coords: { latitude, longitude, accuracy } }) => {
    map.setView([latitude, longitude], 13);
    L.marker([latitude, longitude])
      .addTo(map)
      .bindPopup(`<strong>You are here</strong><br><small>±${Math.round(accuracy)} m</small>`)
      .openPopup();
    L.circle([latitude, longitude], {
      radius: accuracy, color: "#ED6E1C", fillColor: "#ED6E1C", fillOpacity: 0.08, weight: 1,
    }).addTo(map);
  },
  () => {},
  { enableHighAccuracy: true, timeout: 10000 }
);

// ── Markers ──

const markerMap = {};

function makeIcon(color) {
  return L.divIcon({
    className: "",
    html: `<svg width="15" height="15" viewBox="0 0 15 15" xmlns="http://www.w3.org/2000/svg">
      <circle cx="7.5" cy="7.5" r="6.5" fill="${color}" stroke="#FFC440" stroke-width="1.5"/>
    </svg>`,
    iconSize: [15, 15], iconAnchor: [7, 7], popupAnchor: [0, -10],
  });
}

function addMarker(role) {
  const color = role.type === "custom" ? "#8B5CF6" : "#ED6E1C";
  const m = L.marker([role.lat, role.lng], { icon: makeIcon(color) }).addTo(map);
  m.bindPopup(`
    <strong>${role.name}</strong><br>
    ${role.addr ? role.addr + "<br>" : ""}
    <small>${role.city}</small>
    ${role.type !== "custom" ? `<br><small>${role.genre} · ${role.level} · ${role.location}</small>` : ""}
  `);
  m.on("click", () => selectRole(role.id));
  markerMap[role.id] = m;
}

map.on("contextmenu", async ({ latlng: { lat, lng } }) => {
  const id = nextId++;
  const role = {
    id, type: "custom",
    name: `Custom pin #${id}`,
    addr: "",
    city: `${lat.toFixed(4)}° N, ${Math.abs(lng).toFixed(4)}° W`,
    genre: FILTERS.genre[0], level: FILTERS.level[0],
    location: FILTERS.location[0], uniform: FILTERS.uniform[0],
    lat, lng,
  };
  roles.push(role);

  const user = await window.client.getUser();
  const { data, error } = await window.db.from("roles").insert([{
    name: role.name, addr: role.addr, city: role.city,
    genre: role.genre, level: role.level, location: role.location,
    uniform: role.uniform, lat: role.lat, lng: role.lng,
    created_by: user.sub,
  }]).select().single();
  if (!error) role.id = data.id;

  addMarker(role);
  showHint();
  render();
  selectRole(id);
});

function showHint() {
  const hint = document.getElementById("hint");
  hint.classList.add("show");
  setTimeout(() => hint.classList.remove("show"), 2800);
}

// ── Render ──

// Grab elements once
const cardList = document.querySelector("aside ul");
const emptyMsg = document.querySelector("aside > p");

function filtered() {
  return roles.filter(role => {
    for (const key of Object.keys(FILTERS)) {
      if (!active[key].has(role[key])) return false;
    }
    const q = searchVal.toLowerCase();
    if (q && !role.name.toLowerCase().includes(q) && !role.city.toLowerCase().includes(q)) return false;
    return true;
  });
}

function render() {
  const list = filtered();

  // Rebuild markers
  Object.values(markerMap).forEach(m => map.removeLayer(m));
  Object.keys(markerMap).forEach(k => delete markerMap[k]);
  list.forEach(role => addMarker(role));
  if (activeId && markerMap[activeId]) markerMap[activeId].openPopup();

  // Rebuild cards
  cardList.innerHTML = "";
  emptyMsg.hidden = list.length > 0;

  list.forEach(role => {
    const li = document.createElement("li");
    if (role.id === activeId) li.classList.add("active");

    li.innerHTML = `
      <strong>${role.name}</strong>
      ${role.type === "custom" ? "<em>custom</em>" : ""}
      <p>${role.addr ? role.addr + ", " : ""}${role.city}</p>
      ${role.type !== "custom" ? `
        <footer>
          <span>${role.genre}</span>
          <span>${role.level}</span>
          <span>${role.location}</span>
          <span>${role.uniform}</span>
        </footer>
      ` : ""}
      <button aria-label="Remove ${role.name}">×</button>
    `;

    li.addEventListener("click", e => {
      if (e.target.tagName === "BUTTON") return;
      selectRole(role.id);
    });
    li.querySelector("button").addEventListener("click", e => {
      e.stopPropagation();
      removeRole(role.id);
    });

    cardList.appendChild(li);
  });

  updateFilterBtn();
}

function selectRole(id) {
  activeId = activeId === id ? null : id;
  render();
  if (activeId && markerMap[activeId]) {
    map.panTo(markerMap[activeId].getLatLng(), { animate: true });
    markerMap[activeId].openPopup();
    document.querySelector("aside ul li.active")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

function removeRole(id) {
  roles = roles.filter(r => r.id !== id);
  if (activeId === id) activeId = null;
  render();
}

// ── Filters ──

const filterBtn   = document.getElementById("filter-btn");
const filterPanel = document.getElementById("filters");

filterBtn.addEventListener("click", () => {
  const open = filterPanel.classList.toggle("open");
  filterBtn.classList.toggle("active", open);
  filterBtn.setAttribute("aria-expanded", open);
});

document.querySelectorAll(".chip").forEach(chip => {
  chip.addEventListener("click", () => {
    const { filter: f, val: v } = chip.dataset;
    if (active[f].has(v)) {
      if (active[f].size === 1) return;
      active[f].delete(v);
      chip.classList.remove("on");
    } else {
      active[f].add(v);
      chip.classList.add("on");
    }
    render();
  });
});

document.getElementById("clear-filters").addEventListener("click", () => {
  Object.keys(FILTERS).forEach(k => { active[k] = new Set(FILTERS[k]); });
  document.querySelectorAll(".chip").forEach(c => c.classList.add("on"));
  render();
});

function updateFilterBtn() {
  const allOn = Object.keys(FILTERS).every(k => active[k].size === FILTERS[k].length);
  filterBtn.classList.toggle("has-filters", !allOn);
}

// ── Search ──

document.querySelector("aside input").addEventListener("input", e => {
  searchVal = e.target.value;
  render();
});

// ── Init ──

async function loadRoles() {
  try {
    const { data, error } = await window.db.from("roles").select("*");
    if (error) { console.error("Supabase load failed:", error.message); return; }
    if (!data?.length) { render(); return; }
    roles  = data;
    nextId = Math.max(...roles.map(r => r.id)) + 1;
    render();
  } catch (err) {
    console.error("Unexpected error in loadRoles:", err);
  }
}

(async () => {
  if (!await initApp()) return;
  loadRoles();
})();