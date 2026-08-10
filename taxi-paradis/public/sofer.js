const SERVER = "https://nominations-innovations-qty-prospect.trycloudflare.com";

const socket = io(SERVER);

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

        fetch(SERVER + "/locatie-sofer", {

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

                    fetch(SERVER + "/intra-in-statie", {

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

    fetch(SERVER + "/accepta-automat", {
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

    fetch(SERVER + "/refuza-automat", {
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
document.getElementById("renunta").onclick = function () {

    if (!confirm("Sigur dorești să renunți la cursă?")) {
        return;
    }

    document.getElementById("panouCursa").style.display = "none";
    document.getElementById("panouOferta").style.display = "block";
    document.getElementById("oferta").style.display = "none";

    alert("Ai renunțat la cursă.");

};
document.getElementById("laClient").onclick = function () {

    if (stareCursa === "ACCEPTATA") {

        fetch(SERVER + "/la-client", {
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

        });

        return;
    }

    if (stareCursa === "LA_CLIENT") {

        fetch(SERVER + "/in-cursa", {
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

        fetch(SERVER + "/finalizata", {
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

