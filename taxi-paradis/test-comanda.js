const http = require("http");

const data = JSON.stringify({
    telefon: "0700000000",
    plecare: "Strada Mihai Viteazu 130",
    destinatie: "Gara Caracal"
});

const options = {
    hostname: "localhost",
    port: 3000,
    path: "/adauga",
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "Content-Length": data.length
    }
};

const req = http.request(options, res => {
    let raspuns = "";

    res.on("data", bucata => raspuns += bucata);

    res.on("end", () => {
        console.log(raspuns);
    });
});

req.write(data);
req.end();