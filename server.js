const express = require("express");
const fs = require("fs");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
let socketSoferi = {};

io.on("connection", (socket) => {

  socket.on("identificare", (indicativ) => {

  socketSoferi[indicativ] = socket.id;

io.to(socket.id).emit(
  "test",
  "Salut " + indicativ
);
    

    console.log(
      "SOFER CONECTAT:",
      indicativ,
      socket.id
    );

  });

});
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

let comenzi = [];
let locatieSofer = null;
let stareSoferi = {};
let ultimaActivitate = {};
let ofertaCurenta = {};
let listaOferte = {};
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

const traseu = ["G","BCR","S","P"];

let listaSoferi = [];

for (const cod of traseu) {

  const numeStatie = {
    G: "gara",
    BCR: "bcr",
    S: "statia3",
    P: "statia1"
  }[cod];

  console.log("CAUT STATIA:", numeStatie);
  console.log("RAND:", randStatii[numeStatie]);

  if (!randStatii[numeStatie]) continue;

  for (const s of randStatii[numeStatie]) {

    if (!listaSoferi.includes(s))
      listaSoferi.push(s);

  }

}

console.log("LISTA SOFERI:", listaSoferi);

listaOferte[comenzi.length - 1] = {
    lista: listaSoferi,
    pozitie: 0
};

const sofer = listaSoferi[0];

if (sofer) {

    const socketId = socketSoferi[sofer];

    if (socketId) {

        io.to(socketId).emit("comanda_noua", {
            id: comenzi.length - 1,
            plecare: req.body.plecare,
            destinatie: req.body.destinatie
        });

        console.log("COMANDA TRIMISA LA:", sofer);

    }

}

res.send("Comanda adaugata");
});
app.get("/soferi", (req, res) => {

res.send(`

<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Sofer Taxi</title>
</head>

<body>

<h2>Sofer Taxi</h2>
<p>Asteptati comenzi...</p>

<script src="/socket.io/socket.io.js"></script>

<script>

const socket = io();

let indicativ = localStorage.getItem("indicativ");

if (!indicativ) {
    indicativ = prompt("Introdu indicativul masinii");
    localStorage.setItem("indicativ", indicativ);
}

socket.on("connect", () => {
    socket.emit("identificare", indicativ);
});

function trimiteLocatia(){

    navigator.geolocation.getCurrentPosition((pozitie)=>{

        fetch("/locatie-sofer",{

            method:"POST",

            headers:{
                "Content-Type":"application/json"
            },

            body:JSON.stringify({
                indicativ:indicativ,
                lat:pozitie.coords.latitude,
                lng:pozitie.coords.longitude
            })

        })

        .then(r=>r.json())

        .then(r=>{

            if(r.actiune==="INTRARE_STATIE"){

                if(confirm("Ati ajuns in statia "+r.statie+". Intrati la rand?")){

                    fetch("/intra-in-statie",{

                        method:"POST",

                        headers:{
                            "Content-Type":"application/json"
                        },

                        body:JSON.stringify({
                            indicativ:indicativ,
                            statie:r.statie
                        })

                    });

                }

            }

            if(r.actiune==="IESIRE_STATIE"){

                alert("Ati iesit din statia "+r.statie);

            }

        });

    });

}

trimiteLocatia();

setInterval(trimiteLocatia,10000);

socket.on("comanda_noua",(comanda)=>{

    const ok=confirm(
        "Plecare: "+comanda.plecare+
        "\\nDestinatie: "+comanda.destinatie+
        "\\n\\nAcceptati?"
    );

    if(ok){

        fetch("/accepta-automat",{

            method:"POST",

            headers:{
                "Content-Type":"application/json"
            },

            body:JSON.stringify({
    indicativ:indicativ,
    id:comanda.id
})

        });

    }else{

        fetch("/refuza-automat",{

            method:"POST",

            headers:{
                "Content-Type":"application/json"
            },

            body:JSON.stringify({
    indicativ:indicativ,
    id:comanda.id
})

        });

    }

});

</script>

</body>
</html>

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
console.log(
  "RASPUNS",
  indicativ,
  raspuns.actiune,
  statie,
  stareSoferi[indicativ].statie
);

  if (statie) {

    if (!randStatii[statie]) {
        randStatii[statie] = [];
    }

if (
    !randStatii[statie].includes(indicativ) &&
    stareSoferi[indicativ].statie !== statie
) {
    raspuns.actiune = "INTRARE_STATIE";
}

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
stareSoferi[indicativ].ultimaActiune = raspuns.actiune;

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

console.log("TRIMIT:", indicativ, raspuns);
  res.json(raspuns);
app.post("/refuza-automat", (req, res) => {

    const id = req.body.id;

    if (!listaOferte[id]) {
        return res.json({ ok: false });
    }

    listaOferte[id].pozitie++;

    const urmator =
        listaOferte[id].lista[
            listaOferte[id].pozitie
        ];

    if (!urmator) {
        console.log("NU MAI EXISTA SOFERI");
        return res.json({ ok: true });
    }

    const socketId = socketSoferi[urmator];

    if (socketId) {

        io.to(socketId).emit("comanda_noua", {
            id: id,
            plecare: comenzi[id].plecare,
            destinatie: comenzi[id].destinatie
        });

        console.log("COMANDA TRIMISA LA:", urmator);

    }

    res.json({ ok: true });

});

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

  console.log(
    "STATIA",
    statie.toUpperCase(),
    "RAND:",
    randStatii[statie].join(", ")
  );

  res.json({ ok: true });

});

app.post("/iesire-din-statie", (req, res) => {

  const indicativ = req.body.indicativ;
  const statie = req.body.statie;

  if (randStatii[statie]) {
    randStatii[statie] =
      randStatii[statie].filter(s => s !== indicativ);

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
