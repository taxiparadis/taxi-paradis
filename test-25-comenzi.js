const fs = require("fs");
const http = require("http");

const adrese = JSON.parse(
    fs.readFileSync("date/adrese.json", "utf8")
);

const INTERVAL = 2400;
let numarComanda = 0;

function aleatoriu(lista) {
    return lista[Math.floor(Math.random() * lista.length)];
}

function trimiteComanda() {
    let plecare = aleatoriu(adrese).adresa;
    let destinatie = aleatoriu(adrese).adresa;

    while (destinatie === plecare) {
        destinatie = aleatoriu(adrese).adresa;
    }

    const date = JSON.stringify({
        telefon: "07TEST" + String(numarComanda).padStart(4, "0"),
        plecare,
        destinatie
    });

    const inceput = Date.now();

    const req = http.request({
        hostname: "127.0.0.1",
        port: 3001,
        path: "/adauga",
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
            const timp = Date.now() - inceput;

            if (res.statusCode === 200) {
                console.log(
                    new Date().toLocaleTimeString("ro-RO"),
                    "| COMANDA",
                    numarComanda,
                    "|",
                    plecare,
                    "->",
                    destinatie,
                    "|",
                    timp,
                    "ms",
                    "|",
                    body
                );
            } else {
                console.log(
                    "❌ EROARE COMANDA",
                    numarComanda,
                    res.statusCode,
                    body
                );
            }
        });

    });

    req.on("error", err => {
        console.log(
            "❌ EROARE CONEXIUNE COMANDA",
            numarComanda,
            err.message
        );
    });

    req.write(date);
    req.end();
}

console.log("====================================");
console.log("TEST 25 COMENZI / MINUT");
console.log("ADRESE DISPONIBILE:", adrese.length);
console.log("INTERVAL:", INTERVAL, "ms");
console.log("PORT:", 3001);
console.log("====================================");

trimiteComanda();

setInterval(() => {
    numarComanda++;
    trimiteComanda();
}, INTERVAL);
