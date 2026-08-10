const express = require("express");
const fs = require("fs");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
console.log("PID:", process.pid);
let socketSoferi = {};

io.on("connection", (socket) => {

    console.log("SOCKET NOU:", socket.id);

    socket.on("identificare", (indicativ) => {

        socket.indicativ = indicativ;

        socketSoferi[indicativ] = socket.id;

        console.log("SOFER CONECTAT:", indicativ, socket.id);
        console.log("SOFERI ACTIVI:", socketSoferi);

    });

    socket.on("disconnect", () => {

        if (socket.indicativ) {

            delete socketSoferi[socket.indicativ];

            console.log("SOFER DECONECTAT:", socket.indicativ);
            console.log("SOFERI ACTIVI:", socketSoferi);

        }

    });

});
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

let comenzi = [];
let locatieSofer = null;
let stareSoferi = {};
let ultimaActivitate = {};
let ofertaCurenta = {};
const statii = {

  hcc: { lat: 44.111158, lng: 24.353773 },
  statia2: { lat: 44.111704, lng: 24.351611 },
  statia1: { lat: 44.113206, lng: 24.351021 },
  statia3: { lat: 44.111792, lng: 24.348703 },
  targu_vechi: { lat: 44.115156, lng: 24.346476 },
  elena_doamna: { lat: 44.107382, lng: 24.328650 },
  rezi: { lat: 44.107616, lng: 24.343596 },
  parc: { lat: 44.112150, lng: 24.344123 },
  gara: { lat: 44.119591, lng: 24.364296 },
  bcr: { lat: 44.116599, lng: 24.351951 }

};

function distanta(lat1, lng1, lat2, lng2) {

  const dx = lat1 - lat2;
  const dy = lng1 - lng2;

  return Math.sqrt(dx * dx + dy * dy);

}

const RAZA_STATIE = 0.02;

function gasesteStatia(lat, lng) {

  let ceaMaiApropiata = null;
  let distMin = Infinity;

  for (const nume in statii) {

    const d = distanta(
      lat,
      lng,
      statii[nume].lat,
      statii[nume].lng
    );

    if (d < distMin) {
      distMin = d;
      ceaMaiApropiata = nume;
    }

  }

  if (distMin <= RAZA_STATIE) {
    return ceaMaiApropiata;
  }

  return null;

}
try {
comenzi = JSON.parse(fs.readFileSync("comenzi.json", "utf8"));
} catch {
comenzi = [];
}

function salveazaComenzi() {
fs.writeFileSync(
"comenzi.json",
JSON.stringify(comenzi, null, 2)
);
}

app.get("/", (req, res) => {

let html = "";

comenzi.forEach((cursa, index) => {


html += `
<div style="border:1px solid #ccc;padding:10px;margin:10px;">
  <h3>Comanda #${index + 1}</h3>

  <p><b>Data:</b> ${cursa.data}</p>
  <p><b>Ora:</b> ${cursa.ora}</p>
  <p><b>Telefon:</b> ${cursa.telefon}</p>
  <p><b>Plecare:</b> ${cursa.plecare}</p>
  <p><b>Destinatie:</b> ${cursa.destinatie}</p>
  <p><b>Status:</b> ${cursa.status}</p>
  <p><b>Sofer:</b> ${cursa.sofer || "-"}</p>
  <p><b>Indicativ:</b> ${cursa.indicativ || "-"}</p>
  <p><b>Timp:</b> ${cursa.timp || "-"} minute</p>
`;

if (cursa.status === "NOUA") {
  html += `
  <form method="POST" action="/accepta/${index}">
    <input name="sofer" placeholder="Sofer" required><br><br>
    <input name="indicativ" placeholder="Indicativ" required><br><br>
    <input name="timp" placeholder="Minute" required><br><br>
    <button>Accepta cursa</button>
  </form>
  `;
}

if (cursa.status === "ACCEPTATA") {
  html += `
  <form method="POST" action="/status/${index}/LA_CLIENT">
    <button>LA CLIENT</button>
  </form>
  `;
}

if (cursa.status === "LA_CLIENT") {
  html += `
  <form method="POST" action="/status/${index}/IN_CURSA">
    <button>IN CURSA</button>
  </form>
  `;
}

if (cursa.status === "IN_CURSA") {
  html += `
  <form method="POST" action="/status/${index}/FINALIZATA">
    <button>FINALIZATA</button>
  </form>
  `;
}

html += "</div>";


});

res.send(`

  <h1>Taxi Paradis</h1>

  <h2>Adauga comanda</h2>

  <form method="POST" action="/adauga">
    <input name="telefon" placeholder="Telefon" required><br><br>
    <input name="plecare" placeholder="Plecare" required><br><br>
    <input name="destinatie" placeholder="Destinatie" required><br><br>


<button>Adauga</button>


  </form>

  <hr>

${html}

  <script src="/socket.io/socket.io.js"></script>

  <script>
    const socket = io();

    socket.on("actualizare", () => {
      location.reload();
    });
  </script>

`);
});

app.post("/adauga", (req, res) => {

const acum = new Date();

comenzi.push({
telefon: req.body.telefon,
plecare: req.body.plecare,
destinatie: req.body.destinatie,
data: acum.toLocaleDateString("ro-RO"),
ora: acum.toLocaleTimeString("ro-RO"),
status: "NOUA",
sofer: "",
indicativ: "",
timp: ""
});

salveazaComenzi();
io.emit("actualizare");
console.log("PID ADAUGA:", process.pid);
const sofer = primulDinStatie("statia3");

console.log(
  "PRIMUL DIN STATIA3:",
  sofer
);
if (sofer) {

  ofertaCurenta[sofer] = {
    comanda: comenzi.length - 1,
    timp: Date.now()
  };

const socketId = socketSoferi[sofer];

console.log("SOFER:", sofer);
console.log("SOCKET SOFERI:", socketSoferi);
console.log("SOCKET ID:", socketId);

if (socketId) {

  io.to(socketId).emit(
    "comanda_noua",
    comenzi[comenzi.length - 1]
  );

  console.log("EMIT EXECUTAT");

}
  console.log(
    "OFERTA TRIMISA CATRE:",
    sofer
  );

}
res.redirect("/");
});

app.post("/accepta/:id", (req, res) => {

const id = parseInt(req.params.id);

if (comenzi[id]) {

comenzi[id].status = "ACCEPTATA";
comenzi[id].sofer = req.body.sofer;
comenzi[id].indicativ = req.body.indicativ;
comenzi[id].timp = req.body.timp;

salveazaComenzi();
io.emit("actualizare");

}

res.redirect("/");

});

app.post("/status/:id/:status", (req, res) => {

const id = parseInt(req.params.id);

if (comenzi[id]) {
comenzi[id].status = req.params.status;


salveazaComenzi();
io.emit("actualizare");

}

res.redirect("/");
});

app.get("/robot", (req, res) => {

const acum = new Date();

comenzi.push({
telefon: req.query.telefon || "Necunoscut",
plecare: req.query.plecare || "Necunoscut",
destinatie: req.query.destinatie || "Necunoscut",
data: acum.toLocaleDateString("ro-RO"),
ora: acum.toLocaleTimeString("ro-RO"),
status: "NOUA",
sofer: "",
indicativ: "",
timp: ""
});

salveazaComenzi();
io.emit("actualizare");

res.send("Comanda adaugata");
});
app.get("/soferi", (req, res) => {

let html = "<h1>Curse disponibile</h1>";

comenzi.forEach((cursa, index) => {

if (cursa.status === "NOUA") {

  html += `
  <div style="border:1px solid #ccc;padding:10px;margin:10px;">
    <h3>Comanda #${index + 1}</h3>

    <p><b>Plecare:</b> ${cursa.plecare}</p>
    <p><b>Destinatie:</b> ${cursa.destinatie}</p>

    <form method="POST" action="/accepta-sofer/${index}">
      <input name="sofer" placeholder="Nume sofer" required><br><br>
      <input name="indicativ" placeholder="Indicativ" required><br><br>
      <input name="timp" placeholder="Minute pana la client" required><br><br>

      <button>Accepta cursa</button>
    </form>
  </div>
  `;
}

});

res.send(html + `
<script src="/socket.io/socket.io.js"></script>

<script>
let indicativ = localStorage.getItem("indicativ");

if (!indicativ) {
    indicativ = prompt("Introdu indicativul masinii");
    localStorage.setItem("indicativ", indicativ);
}

const socket = io();

socket.on("connect", () => {

alert("CONNECT");

    console.log("SOCKET CONECTAT:", socket.id);
    socket.emit("identificare", indicativ);
    console.log("IDENTIFICARE TRIMISA:", indicativ);
});

socket.on("test", (mesaj) => {
    alert(mesaj);
});

socket.on("comanda_noua", (comanda) => {
    alert(
        "CURSA NOUA\n\n" +
        "Plecare: " + comanda.plecare +
        "\nDestinatie: " + comanda.destinatie
    );
});

function trimiteLocatia() {

    navigator.geolocation.getCurrentPosition(function(pozitie) {

        fetch("/locatie-sofer", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                indicativ: indicativ,
                lat: pozitie.coords.latitude,
                lng: pozitie.coords.longitude
            })
        })
        .then(r => r.json())
        .then(raspuns => {

            console.log(raspuns);

            if (raspuns.actiune === "INTRARE_STATIE") {

                alert("Ati ajuns in statia " + raspuns.statie.toUpperCase());

                if (confirm("Intrati la rand?")) {

                    fetch("/intra-in-statie", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            indicativ: indicativ,
                            statie: raspuns.statie
                        })
                    });

                }

            }

            if (raspuns.actiune === "IESIRE_STATIE") {

                alert("Ati plecat din statia " + raspuns.statie.toUpperCase());

            }

        });

    });

}

trimiteLocatia();
setInterval(trimiteLocatia, 10000);

</script>


`);

});
app.post("/accepta-sofer/:id", (req, res) => {

const id = parseInt(req.params.id);

if (comenzi[id]) {

  comenzi[id].status = "ACCEPTATA";
  comenzi[id].sofer = req.body.sofer;
  comenzi[id].indicativ = req.body.indicativ;
  comenzi[id].timp = req.body.timp;

  salveazaComenzi();
  io.emit("actualizare");

}

res.redirect("/soferi");
});

app.post("/locatie-sofer", (req, res) => {

  locatieSofer = req.body;

  const indicativ = req.body.indicativ;

ultimaActivitate[indicativ] = Date.now();

  const statie = gasesteStatia(
    req.body.lat,
    req.body.lng
  );

  if (!stareSoferi[indicativ]) {
    stareSoferi[indicativ] = {
      statie: null
    };
  }

  let raspuns = {
    actiune: null,
    statie: statie
  };

  if (
    statie &&
    stareSoferi[indicativ].statie !== statie
  ) {
    raspuns.actiune = "INTRARE_STATIE";
  }

  if (
    !statie &&
    stareSoferi[indicativ].statie
  ) {
    raspuns.actiune = "IESIRE_STATIE";
    raspuns.statie =
      stareSoferi[indicativ].statie;
  }

  stareSoferi[indicativ].statie = statie;

  console.log(
  "Sofer",
  indicativ,
  "Lat:",
  req.body.lat,
  "Lng:",
  req.body.lng,
  "Statie:",
  statie || "IN.AFARA.STATIEI"
);

  res.json(raspuns);

});
let randStatii = {};
function primulDinStatie(statie) {

  if (!randStatii[statie]) {
    return null;
  }

  if (randStatii[statie].length === 0) {
    return null;
  }

  return randStatii[statie][0];

}
app.post("/intra-in-statie", (req, res) => {

  const indicativ = req.body.indicativ;
  const statie = req.body.statie;

  if (!randStatii[statie]) {
    randStatii[statie] = [];
  }

  if (!randStatii[statie].includes(indicativ)) {
    randStatii[statie].push(indicativ);
  }

  const pozitie =
    randStatii[statie].indexOf(indicativ) + 1;

  console.log(
    "STATIA",
    statie.toUpperCase(),
    "RAND:",
    randStatii[statie].join(", ")
  );

  res.json({
    ok: true,
    pozitie: pozitie
  });

});
app.post("/iesire-din-statie", (req, res) => {

  console.log("A AJUNS LA IESIRE");

  const indicativ = req.body.indicativ;
  const statie = req.body.statie;
  console.log("A AJUNS LA IESIRE");
  console.log("INDICATIV:", indicativ);
  console.log("STATIE:", statie);
  console.log("RANDURI:", randStatii); 

  if (randStatii[statie]) {

    randStatii[statie] =
      randStatii[statie].filter(
        s => s !== indicativ
      );

    console.log(
      "STATIA",
      statie.toUpperCase(),
      "RAND:",
      randStatii[statie].join(", ")
    );

  }

  res.json({ ok: true });

});
setInterval(() => {

  const acum = Date.now();

  for (const indicativ in ultimaActivitate) {

console.log("VERIFIC OFFLINE", Object.keys(ultimaActivitate));

    if (acum - ultimaActivitate[indicativ] > 30000) {

      console.log("SOFER OFFLINE:", indicativ);

      for (const statie in randStatii) {

        randStatii[statie] =
          randStatii[statie].filter(
            s => s !== indicativ
          );

      }

      for (const statie in randStatii) {

  randStatii[statie] =
    randStatii[statie].filter(
      s => s !== indicativ
    );

  console.log(
    "STATIA",
    statie.toUpperCase(),
    "RAND:",
    randStatii[statie].join(", ")
  );

}

delete ultimaActivitate[indicativ];

    }

  }

}, 10000);
server.listen(3000, "0.0.0.0", () => {
console.log("Taxi Paradis ruleaza pe portul 3000");
});
