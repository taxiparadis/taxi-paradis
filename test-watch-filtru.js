const http = require("http");

let ultimaPozitieBuna = null;
let ultimaTrimitere = 0;

const ACCURACY_MAX = 50;
const INTERVAL_MINIM = 10000;
const DISTANTA_MAXIMA = 150;

function distantaMetri(lat1, lng1, lat2, lng2) {

    const R = 6371000;

    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;

    return R * 2 * Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
    );
}

function trimiteServer(pozitie, eticheta) {

    const acum = Date.now();

    if (pozitie.accuracy > ACCURACY_MAX) {
        console.log(
            "❌ RESPINS ACCURACY:",
            eticheta,
            pozitie.accuracy + "m"
        );
        return;
    }

    if (ultimaPozitieBuna) {

        const distanta = distantaMetri(
            ultimaPozitieBuna.lat,
            ultimaPozitieBuna.lng,
            pozitie.lat,
            pozitie.lng
        );

        if (distanta > DISTANTA_MAXIMA) {
            console.log(
                "❌ RESPINS SALT GPS:",
                eticheta,
                Math.round(distanta) + "m"
            );
            return;
        }
    }

    if (acum - ultimaTrimitere < INTERVAL_MINIM) {
        console.log(
            "⏳ NU TRIMITE:",
            eticheta,
            "prea repede"
        );
        return;
    }

    ultimaTrimitere = acum;
    ultimaPozitieBuna = pozitie;

    const body = JSON.stringify({
        indicativ: "WATCH-TEST",
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
            "Content-Length": Buffer.byteLength(body)
        }
    }, res => {

        let data = "";

        res.on("data", chunk => data += chunk);

        res.on("end", () => {
            console.log(
                "✅ TRIMIS:",
                eticheta,
                "->",
                data
            );
        });
    });

    req.on("error", err => {
        console.log("EROARE:", err.message);
    });

    req.write(body);
    req.end();
}

const pozitii = [

    {
        lat: 44.111158,
        lng: 24.353773,
        accuracy: 5,
        eticheta: "GPS BUN - HCC"
    },

    {
        lat: 44.111200,
        lng: 24.353773,
        accuracy: 10,
        eticheta: "DEPLASARE NORMALA"
    },

    {
        lat: 44.111250,
        lng: 24.353773,
        accuracy: 20,
        eticheta: "DEPLASARE NORMALA"
    },

    {
        lat: 44.200000,
        lng: 24.500000,
        accuracy: 5,
        eticheta: "SALT GPS MARE"
    },

    {
        lat: 44.111300,
        lng: 24.353773,
        accuracy: 300,
        eticheta: "GPS PROST - 300m"
    },

    {
        lat: 44.111350,
        lng: 24.353773,
        accuracy: 10,
        eticheta: "GPS BUN - REVINE"
    }
];

let i = 0;

function urmatorul() {

    if (i >= pozitii.length) {
        console.log("\n=== TEST WATCH + FILTRU TERMINAT ===");
        return;
    }

    const p = pozitii[i];

    trimiteServer(p, p.eticheta);

    i++;

    setTimeout(urmatorul, 3000);
}

console.log("=== TEST WATCH + FILTRU ===");
console.log("Accuracy maxim:", ACCURACY_MAX + "m");
console.log("Salt maxim:", DISTANTA_MAXIMA + "m");
console.log("Interval minim:", INTERVAL_MINIM / 1000 + " secunde");

urmatorul();
