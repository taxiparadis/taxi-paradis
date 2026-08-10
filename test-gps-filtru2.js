const http = require("http");

function trimite(lat, lng, accuracy, eticheta) {
    return new Promise((resolve) => {

        const date = JSON.stringify({
            indicativ: "SIM-FILTRU",
            lat,
            lng,
            accuracy
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

            let data = "";

            res.on("data", chunk => data += chunk);

            res.on("end", () => {
                console.log("\n" + eticheta);
                console.log("GPS:", lat, lng, "accuracy:", accuracy);
                console.log(data);
                resolve();
            });
        });

        req.write(date);
        req.end();
    });
}

async function test() {

    console.log("=== TEST FILTRARE GPS ===");

    await trimite(
        44.111158,
        24.353773,
        5,
        "1. INTRARE HCC"
    );

    await trimite(
        44.111248,
        24.353773,
        5,
        "2. +10 metri"
    );

    await trimite(
        44.111518,
        24.353773,
        5,
        "3. +30 metri"
    );

    await trimite(
        44.111788,
        24.353773,
        5,
        "4. +30 metri"
    );

    await trimite(
        44.112058,
        24.353773,
        5,
        "5. IESIRE NORMALA"
    );

    await trimite(
        44.200000,
        24.500000,
        300,
        "6. SALT GPS + ACCURACY 300m"
    );

    await trimite(
        44.111158,
        24.353773,
        300,
        "7. REVINIRE CU ACCURACY 300m"
    );

    await trimite(
        44.111158,
        24.353773,
        5,
        "8. REVINIRE CU GPS BUN"
    );

    console.log("\n=== TEST TERMINAT ===");
}

test();
