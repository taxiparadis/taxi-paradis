const http = require("http");
const { io } = require("socket.io-client");

const NUMAR_MASINI = 150;
const INTERVAL = 10000;

const masini = [];

for (let i = 1; i <= NUMAR_MASINI; i++) {
    masini.push({
        indicativ: "TEST" + i,
        parola: "test123",
        lat: 44.111 + (Math.random() - 0.5) * 0.01,
        lng: 24.352 + (Math.random() - 0.5) * 0.01,
        socket: null
    });
}

function conecteazaSocket(masina) {

    const socket = io("http://127.0.0.1:3001", {
        transports: ["websocket"]
    });

    masina.socket = socket;

    socket.on("connect", () => {
        socket.emit("identificare", {
            indicativ: masina.indicativ,
            parola: masina.parola
        });
    });

    socket.on("login_ok", () => {
        console.log("CONECTAT:", masina.indicativ);
    });

    socket.on("login_eroare", mesaj => {
        console.log("LOGIN EROARE:", masina.indicativ, mesaj);
    });

    socket.on("comanda_noua", comanda => {
        console.log(
            ">>> COMANDA PRIMITA:",
            masina.indicativ,
            JSON.stringify(comanda)
        );
    });

    socket.on("disconnect", () => {
        console.log("DECONECTAT:", masina.indicativ);
    });

    socket.on("connect_error", err => {
        console.log(
            "EROARE SOCKET:",
            masina.indicativ,
            err.message
        );
    });
}

function trimiteGPS(masina) {

    const date = JSON.stringify({
        indicativ: masina.indicativ,
        lat: masina.lat,
        lng: masina.lng
    });

    const req = http.request({
        hostname: "127.0.0.1",
        port: 3001,
        path: "/locatie-sofer",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(date)
        }
    }, res => {

        let body = "";

        res.on("data", chunk => {
            body += chunk;
        });

        res.on("end", () => {
            if (res.statusCode !== 200) {
                console.log(
                    "EROARE GPS",
                    masina.indicativ,
                    res.statusCode,
                    body
                );
            }
        });
    });

    req.on("error", err => {
        console.log(
            "EROARE CONEXIUNE GPS",
            masina.indicativ,
            err.message
        );
    });

    req.write(date);
    req.end();
}

function trimiteToate() {

    const inceput = Date.now();

    for (const masina of masini) {
        trimiteGPS(masina);
    }

    console.log(
        new Date().toLocaleTimeString("ro-RO"),
        "- GPS trimis pentru",
        masini.length,
        "mașini -",
        Date.now() - inceput,
        "ms"
    );
}

console.log("====================================");
console.log("TEST 150 MASINI - GPS + SOCKET.IO");
console.log("NUMAR:", NUMAR_MASINI);
console.log("PORT:", 3001);
console.log("INTERVAL:", INTERVAL, "ms");
console.log("====================================");

for (const masina of masini) {
    conecteazaSocket(masina);
}

setTimeout(() => {
    trimiteToate();
    setInterval(trimiteToate, INTERVAL);
}, 3000);
