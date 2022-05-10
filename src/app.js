let elements = {
  navigator: null,
  mapDiv: null,
  map: null,
  locateBtn: null,
  deleteAllBtn: null,

  marker: null,
  circle: null,

  listenTimerID: null,
  shouldListen: false,
};

let markers = [];
let data;
let state = {
  id: null,
  lat: null,
  lon: null,
};

const onLocateSuccess = (position) => {
  const { coords } = position;

  console.log(coords.latitude, coords.longitude);
  const leafletCoords = { lon: coords.longitude, lat: coords.latitude };
  elements.map.setView(leafletCoords, 12);
};

const errors = {
  1: "[PERMISSION_DENIED] Permission was denied to access location services.",
  2: "[POSITION_UNAVAILABLE] The GPS was not able to determine a location",
  3: "[TIMEOUT] The GPS failed to determine a location within the timeout duration",
};

const onLocateFailure = (error) => {
  console.error("Could not access location services!");
  console.error("errors[error.code]", errors[error.code]);
  console.error("error.message", error.message);
};

const locate = () => {
  if (!navigator.geolocation) {
    console.log("Geolocation is not supported by your browser!");
  } else {
    navigator.geolocation.getCurrentPosition(onLocateSuccess, onLocateFailure);
  }
};

const onClick = () => {
  markers.forEach((item) => {
    if (
      item.marker._latlng.lat == data.lat &&
      item.marker._latlng.lng == data.lng
    ) {
      elements.map.removeLayer(item.marker);
      localforage.removeItem(item.key);
    }
  });

  ons.notification.alert("Marker Clicked!");
};

const deleteAll = () => {
  markers.forEach((item) => {
    elements.map.removeLayer(item.marker);
    markers = [];
  });
  localforage.clear();
  ons.notification.alert("All markers deleted!");
};

const onCreateMarker = (e) => {
  ons.notification
    .prompt("Assign an identifier to this marker")
    .then(function (input) {
      var message = input ? "ID: " + input : "Default marker";

      elements.marker = L.marker([e.latlng.lat, e.latlng.lng])
        .addTo(elements.map)
        .bindPopup(
          `<p style="text-align: center">${message}</p>\
          <p style="text-align: center">\
        <ons-button onclick="onClick()">Delete me!</ons-button>\
      </p>`
        );
      console.log(message);
      markers.push({ key: input, marker: elements.marker });
      state = { id: input, lat: e.latlng.lat, lng: e.latlng.lng };
      saveState(input);
      elements.marker.addEventListener("click", (e) => {
        data = { lat: e.latlng.lat, lng: e.latlng.lng };
        console.log(data);
      });
      console.log(markers);
    });
};

const saveState = async (id) => {
  console.log("saving state:", state);

  try {
    await localforage.setItem(id, state);
  } catch (e) {
    return console.log("error", e);
  }

  console.log("success");
};

const loadState = async () => {
  console.log("loading state");

  await localforage
    .iterate(function (value) {
      elements.marker = L.marker([value.lat, value.lng])
        .addTo(elements.map)
        .bindPopup(
          `<p style="text-align: center">${value.id}</p>\
          <p style="text-align: center">\
        <ons-button onclick="onClick()">Delete me!</ons-button>\
      </p>`
        );
      markers.push({ key: value.id, marker: elements.marker });
      elements.marker.addEventListener("click", (e) => {
        data = { lat: e.latlng.lat, lng: e.latlng.lng };
        console.log(data);
      });
      console.log("success");
    })
    .catch(function (err) {
      console.log("error loading state", err);
    });
};

const initMap = () => {
  const map = L.map("map").setView({ lon: -99.13, lat: 19.43 }, 3);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>',
  }).addTo(map);

  L.control.scale({ imperial: false, metric: true }).addTo(map);

  map.addEventListener("click", onCreateMarker);

  loadState();

  return map;
};

const setUpPage = (evt) => {
  console.log("start init", evt.target.id);
  if (evt.target.id === "home") {
    elements = {
      navigator: document.querySelector("#navigator"),
      mapDiv: document.querySelector("#map"),
      map: initMap(),
      locateBtn: document.querySelector("#locateBtn"),
      deleteAllBtn: document.querySelector("#deleteAllBtn"),
    };
    elements.locateBtn.addEventListener("click", locate);
    elements.deleteAllBtn.addEventListener("click", deleteAll);
  }
};

const handleVisibilityChange = () => {
  if (document.hidden) {
    if (elements.listenTimerID) stopListening(elements.shouldListen);
  } else {
    if (!elements.listenTimerID && elements.shouldListen) listenInterval();
  }
};

document.addEventListener("init", setUpPage);
document.addEventListener("visibilitychange", handleVisibilityChange);
