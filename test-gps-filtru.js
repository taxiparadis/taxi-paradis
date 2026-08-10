const http = require("http");

const pozitii = [
  {lat: 44.111158, lng: 24.353773, accuracy: 5, descriere: "HCC - pornire"},
  {lat: 44.111248, lng: 24.353773, accuracy: 5, descriere: "+10 m"},
  {lat: 44.111518, lng: 24.353773, accuracy: 5, descriere: "+30 m"},
  {lat: 44.111788, lng: 24.353773, accuracy: 5, descriere: "+30 m"},
  {lat: 44.112058, lng: 24.353773, accuracy: 5, descriere: "+30 m"},
  {lat: 44.200000, lng: 24.500000, accuracy: 5, descriere: "SALT GPS MARE"},
  {lat: 44.112100, lng: 24.353773, accuracy: 5, descriere: "revenire"},
];

function trimite(pozitie) {
  const date = JSON.stringify({
    indicativ: "SIMGPS",
    lat: pozitie.lat,
    lng: pozitie.lng,
    accuracy: pozitie.accuracy
  });

  const req = http.request({
    hostname: "localhost",
    port: 3000,
    path: "/locatie-sofer",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(date)
    }
  }, res => {
    let body = "";

    res.on("data", chunk => body += chunk);

    res.on("end", () => {
      console.log("\n" + pozitie.descriere);
      console.log(body);
    });
  });

  req.on("error", err => {
    console.error("EROARE:", err.message);
  });

  req.write(date);
  req.end();
}

let i = 0;

function urmatorul() {
  if (i >= pozitii.length) {
    console.log("\n=== TEST TERMINAT ===");
    return;
  }

  trimite(pozitii[i]);
  i++;

  setTimeout(urmatorul, 3000);
}

urmatorul();
