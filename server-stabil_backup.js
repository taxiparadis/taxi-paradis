const express = require("express");
const fs = require("fs");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
app.use(express.json());
const server = http.createServer(app);
const io = new Server(server);

let socketSoferi = {};
let prioritateComanda = null;

io.on("connection", (socket) => {

socket.emit(
      "actualizare_statii",
      randStatii
  );
socket.emit(
        "lista_comenzi",
        comenzi
    );
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


  socket.on("cerere_statii", () => {

    socket.emit(
      "actualizare_statii",
      randStatii
    );

  });


});
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/Alerta", express.static("Alerta"));
app.use(express.static("public"));

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

const RAZA_STATIE = 0.01;

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

function trimiteOferta(idComanda) {

    const oferta = listaOferte[idComanda];

    if (!oferta) return;

    if (oferta.pozitie >= oferta.lista.length) {
        console.log("NU MAI EXISTA SOFERI");
        return;
    }

    const sofer = oferta.lista[oferta.pozitie];
    const socketId = socketSoferi[sofer];

    console.log("COMANDA TRIMISA LA:", sofer);

    if (socketId) {

        io.to(socketId).emit("comanda_noua", {
            id: idComanda,
            plecare: comenzi[idComanda].plecare,
            destinatie: comenzi[idComanda].destinatie
        });

    }

setTimeout(() => {

    if (!listaOferte[idComanda]) return;

    if (socketId) {
        io.to(socketId).emit("anuleaza_comanda");
    }

    oferta.pozitie++;

    trimiteOferta(idComanda);

}, 15000);

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

<!DOCTYPE html>
<html lang="ro">

<head>

<meta charset="utf-8">

<title>Taxi Paradis - Dispecerat</title>

<style>

body{
    margin:0;
    font-family:Arial;
    background:#eceff1;
}

header{
    background:#111827;
    color:white;
    padding:20px;
    text-align:center;
    font-size:30px;
    font-weight:bold;
}

.container{
    width:95%;
    max-width:900px;
    margin:20px auto;
}

.formular{
    background:white;
    padding:20px;
    border-radius:15px;
    box-shadow:0 3px 10px rgba(0,0,0,.15);
}

input{
    width:100%;
    padding:12px;
    margin:8px 0;
    font-size:16px;
    border:1px solid #ccc;
    border-radius:8px;
    box-sizing:border-box;
}

button{
    padding:12px 20px;
    background:#16a34a;
    color:white;
    border:none;
    border-radius:8px;
    cursor:pointer;
    font-size:17px;
}

button:hover{
    background:#15803d;
}

hr{
    margin:25px 0;
}

</style>

</head>

<body>

<header>
🚖 TAXI PARADIS - DISPECERAT
</header>

<div class="container">

<div class="formular">

<h2>Adaugă comandă</h2>

<form method="POST" action="/adauga">

<input name="telefon" placeholder="Telefon" required>

<input name="plecare" placeholder="Plecare" required>

<input name="destinatie" placeholder="Destinație" required>

<br><br>

<button type="submit">
🚖 Adaugă comandă
</button>

</form>

</div>

<hr>

${html}

</div>

<script src="/socket.io/socket.io.js"></script>

<script>

const socket = io();

socket.on("actualizare",function(){

location.reload();

});

</script>

</body>

</html>

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
io.emit("lista_comenzi", comenzi);

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

if (prioritateComanda) {

    listaSoferi = listaSoferi.filter(
        s => s !== prioritateComanda
    );

    listaSoferi.unshift(prioritateComanda);

    console.log("PRIORITATE:", prioritateComanda);

    prioritateComanda = null;
}

listaOferte[comenzi.length - 1] = {
    lista: listaSoferi,
    pozitie: 0
};

trimiteOferta(comenzi.length - 1);
res.json({
    ok: true,
    id: comenzi.length - 1
});

});
app.get("/soferi", (req, res) => {

res.send(`

<!DOCTYPE html>
<html>
<head>
<link rel="manifest" href="/manifest.json">

<meta name="theme-color" content="#111827">

<link rel="apple-touch-icon" href="/icons/icon-192.png">

<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta charset="utf-8">
<link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css">
<script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
<title>Sofer Taxi</title>
<link rel="stylesheet" href="/style.css">
</head>

<body>
<div id="map" style="
position:fixed;
top:0;
left:0;
width:100%;
height:100%;
z-index:0;
"></div>

<h2 style="
position:fixed;
top:15px;
left:15px;
margin:0;
padding:12px 18px;
background:rgba(20,20,20,.85);
color:white;
border-radius:15px;
font-family:Arial;
z-index:999;
">
🚖 TAXI PARADIS
</h2>

<button id="online"
style="
position:fixed;
top:15px;
right:15px;
display:inline-block;
width:auto;
padding:10px 18px;
background:#16a34a;
color:white;
border:none;
border-radius:12px;
z-index:9999;
">
🟢 ONLINE
</button>

<div id="oferta" style="
display:none;
position:fixed;
left:15px;
right:15px;
bottom:15px;
padding:20px;
border-radius:20px;
background:rgba(20,20,20,0.85);
color:white;
z-index:999;
">
<div id="panouOferta">

<div style="
text-align:center;
font-size:28px;
font-weight:bold;
margin-bottom:20px;
">
🚖 COMANDĂ NOUĂ
</div>

<div style="
background:#2d3748;
padding:15px;
border-radius:15px;
margin-bottom:12px;
">

<div style="font-size:13px;color:#9ca3af;">
📍 PLECARE
</div>

<div id="plecare" style="font-size:22px;font-weight:bold;"></div>

</div>

<div style="
background:#2d3748;
padding:15px;
border-radius:15px;
margin-bottom:12px;
">

<div style="font-size:13px;color:#9ca3af;">
🏁 DESTINAȚIE
</div>

<div id="destinatie" style="font-size:22px;font-weight:bold;"></div>

</div>

<div style="
text-align:center;
font-size:30px;
font-weight:bold;
margin:20px 0;
">
⏳ <span id="cronometru">15</span>s
</div>

<div style="display:flex;gap:10px;">
<button id="accepta" style="
width:100%;
height:60px;
background:#16a34a;
color:white;
border:none;
border-radius:15px;
font-size:22px;
font-weight:bold;
margin-top:10px;
">
🟢 ACCEPTĂ
</button>
<button id="refuza" style="
width:100%;
height:60px;
background:#dc2626;
color:white;
border:none;
border-radius:15px;
font-size:22px;
font-weight:bold;
margin-top:10px;
">
🔴 REFUZĂ
</button>
</div>

</div>

<div id="panouCursa" style="display:none;">

<h3 id="titluCursa">🚖 CURSĂ ACCEPTATĂ</h3>

<p><b>📍 Plecare:</b> <span id="plecare2"></span></p>

<p><b>🏁 Destinație:</b> <span id="destinatie2"></span></p>

<br>

<div style="display:flex;gap:10px;">
<button id="googleMaps" style="
flex:1;
height:55px;
background:#1a73e8;
color:white;
border:none;
border-radius:15px;
font-size:20px;
font-weight:bold;
margin-top:10px;
">
🧭 NAVIGHEAZĂ CU GOOGLE MAPS
</button>

<button id="waze" style="
flex:1;
height:55px;
background:#7b61ff;
color:white;
border:none;
border-radius:15px;
font-size:20px;
font-weight:bold;
margin-top:10px;
">
🚗 DESCHIDE WAZE
</button>
</div>

<div style="display:flex;gap:10px;">
<button id="laClient" style="
flex:1;
height:55px;
background:#f59e0b;
color:white;
border:none;
border-radius:15px;
font-size:20px;
font-weight:bold;
margin-top:10px;
">
🚕 LA CLIENT
</button>

<button id="clientAbsent" style="
display:none;
flex:1;
height:55px;
background:#dc2626;
color:white;
border:none;
border-radius:15px;
font-size:20px;
font-weight:bold;
margin-top:10px;
">
❌ CLIENTUL NU A VENIT
</button>

<button id="renunta" style="
flex:1;
height:55px;
background:#4b5563;
color:white;
border:none;
border-radius:15px;
font-size:20px;
font-weight:bold;
margin-top:10px;
">
❌ RENUNȚĂ
</button>
</div>
</div>


<script src="/socket.io/socket.io.js"></script>

<script>

const map = L.map('map', {
    zoomControl: false,
    attributionControl: false
}).setView([44.435, 24.371], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
}).addTo(map);
let markerSofer = L.marker([44.435, 24.371]).addTo(map);

const socket = io();

let comandaCurenta = null;
let timer = null;
let stareCursa = "ACCEPTATA";



const alarma = new Audio("/Alerta/freesound_community-beep-beep-beep-beep-80262.mp3");

alarma.loop = true;

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

markerSofer.setLatLng([
            pozitie.coords.latitude,
            pozitie.coords.longitude
        ]);

        map.setView([
            pozitie.coords.latitude,
            pozitie.coords.longitude
        ],16);

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

    alarma.currentTime = 0;
alarma.play()
.then(() => {
    console.log("SUNET PORNIT");
})
.catch((err) => {
    console.log("EROARE SUNET:", err);
});
    comandaCurenta = comanda;

    document.getElementById("plecare").innerText = comanda.plecare;
    document.getElementById("destinatie").innerText = comanda.destinatie;
    document.getElementById("oferta").style.display = "block";

document.getElementById("panouOferta").style.display = "block";
document.getElementById("panouCursa").style.display = "none";

    let secunde = 15;
    document.getElementById("cronometru").innerText = secunde;

    if(timer){
        clearInterval(timer);
    }

    timer = setInterval(()=>{

        secunde--;

        document.getElementById("cronometru").innerText = secunde;

        if(secunde<=0){

            clearInterval(timer);

alarma.pause();
alarma.currentTime = 0;

            document.getElementById("oferta").style.display="none";

        }

    },1000);

});

document.getElementById("accepta").onclick = function () {

    clearInterval(timer);

    alarma.pause();
    alarma.currentTime = 0;

    fetch("/accepta-automat", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            indicativ: indicativ,
            id: comandaCurenta.id
        })
    })
    .then(r => r.json())
.then(() => {

    document.getElementById("panouOferta").style.display = "none";
    document.getElementById("panouCursa").style.display = "block";

    document.getElementById("plecare2").innerText = comandaCurenta.plecare;
    document.getElementById("destinatie2").innerText = comandaCurenta.destinatie;
stareCursa = "ACCEPTATA";
});

};

document.getElementById("refuza").onclick=function(){

    clearInterval(timer);

alarma.pause();
alarma.currentTime = 0;

    document.getElementById("oferta").style.display="none";

    fetch("/refuza-automat",{
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify({
            indicativ:indicativ,
            id:comandaCurenta.id
        })
    });

};

document.getElementById("googleMaps").onclick = function () {

    window.open(
        "https://www.google.com/maps/search/?api=1&query=" +
        encodeURIComponent(comandaCurenta.plecare),
        "_blank"
    );

};

document.getElementById("waze").onclick = function () {

    window.open(
        "https://waze.com/ul?q=" +
        encodeURIComponent(comandaCurenta.plecare),
        "_blank"
    );

};


document.getElementById("clientAbsent").onclick = function () {

alert("AM APĂSAT CLIENT ABSENT");

    if (!comandaCurenta) {
        return;
    }

    fetch("/client-absent", {
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify({
            indicativ: indicativ,
            id: comandaCurenta.id
        })
    });

    document.getElementById("panouCursa").style.display="none";
    document.getElementById("oferta").style.display="none";

    comandaCurenta = null;
    stareCursa = "LIBER";

};
document.getElementById("laClient").onclick = function () {

    if (stareCursa === "ACCEPTATA") {

        fetch("/la-client", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                indicativ: indicativ,
                id: comandaCurenta.id
            })
        })
        .then(r => r.json())
        .then(() => {

            stareCursa = "LA_CLIENT";

            document.getElementById("titluCursa").innerText = "🚖 LA CLIENT";
            document.getElementById("laClient").innerText = "▶ În cursă";

            document.getElementById("clientAbsent").style.display = "block";

        });

        return;
    }

    if (stareCursa === "LA_CLIENT") {

        fetch("/in-cursa", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                indicativ: indicativ,
                id: comandaCurenta.id
            })
        })
        .then(r => r.json())
        .then(() => {

            stareCursa = "IN_CURSA";

            document.getElementById("titluCursa").innerText = "🚖 ÎN CURSĂ";
            document.getElementById("laClient").innerText = "🏁 Finalizată";

        });

        return;
    }

    if (stareCursa === "IN_CURSA") {

        fetch("/finalizata", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                indicativ: indicativ,
                id: comandaCurenta.id
            })
        })
        .then(r => r.json())
        .then(() => {

            stareCursa = null;
            comandaCurenta = null;

            document.getElementById("panouCursa").style.display = "none";
            document.getElementById("oferta").style.display = "none";

            document.getElementById("titluCursa").innerText = "🚖 CURSĂ ACCEPTATĂ";
            document.getElementById("laClient").innerText = "✅ La client";

            alert("Cursa a fost finalizată.");

        });

        return;
    }

};


socket.on("anuleaza_comanda",()=>{

    clearInterval(timer);

alarma.pause();
alarma.currentTime = 0;

document.getElementById("oferta").style.display="none";

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
io.emit("lista_comenzi", comenzi);

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
    randStatii[statie].push(indicativ);
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
});

app.post("/accepta-automat", (req, res) => {
    console.log("ACCEPTARE PRIMITA:", req.body);

    const id = req.body.id;

    if (!comenzi[id]) {
        return res.json({ ok: false });
    }

    comenzi[id].status = "ACCEPTATA";
    comenzi[id].indicativ = req.body.indicativ;

    // Scrie pe disc în timp real ca să vadă Linux-ul prin rețea
    fs.writeFileSync("comenzi.json", JSON.stringify(comenzi, null, 2));

    console.log(
        "CURSA ACCEPTATA:",
        id,
        "SOFER:",
        req.body.indicativ
    );

    comenzi[id].oraAcceptare = new Date().toLocaleTimeString("ro-RO");

    if (typeof salveazaComenzi === "function") {
        salveazaComenzi();
    }

    if (typeof listaOferte !== "undefined" && listaOferte[id]) {
        delete listaOferte[id];
    }

    if (typeof io !== "undefined") {
        io.emit("actualizare");
        io.emit("lista_comenzi", comenzi);
    }

    return res.json({ ok: true, indicativ: req.body.indicativ });
});

app.post("/la-client", (req, res) => {

    const id = req.body.id;

    if (!comenzi[id]) {
        return res.json({ ok: false });
    }

    comenzi[id].status = "LA_CLIENT";

    salveazaComenzi();

    io.emit("actualizare");
io.emit("lista_comenzi", comenzi);

    res.json({ ok: true });

});
app.post("/in-cursa", (req, res) => {

    const id = req.body.id;

    if (!comenzi[id]) {
        return res.json({ ok: false });
    }

    comenzi[id].status = "IN_CURSA";

    salveazaComenzi();

    io.emit("actualizare");
io.emit("lista_comenzi", comenzi);

    res.json({ ok: true });

});
app.post("/client-absent",(req,res)=>{

    console.log(
        "CLIENT ABSENT",
        req.body.indicativ,
        req.body.id
    );

    res.json({
        ok:true
    });

});
app.post("/finalizata", (req, res) => {

    const id = req.body.id;

    if (!comenzi[id]) {
        return res.json({ ok: false });
    }

    comenzi[id].status = "FINALIZATA";

    salveazaComenzi();

    io.emit("actualizare");
io.emit("lista_comenzi", comenzi);

    res.json({ ok: true });

});
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

    io.emit(
        "actualizare_statii",
        randStatii
    );
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

io.emit(
    "actualizare_statii",
    randStatii
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

app.get("/comanda/:id", (req, res) => {

    const id = req.params.id;

    if (!comenzi[id]) {
        return res.json({ ok:false });
    }

    res.json({
        ok:true,
        status: comenzi[id].status,
        sofer: comenzi[id].indicativ
    });

});
server.listen(3000, '0.0.0.0', () => {
    console.log("Taxi Paradis ruleaza pe portul 3000");
});

