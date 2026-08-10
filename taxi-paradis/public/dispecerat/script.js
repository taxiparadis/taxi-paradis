// PORNIRE HARTĂ

let map = L.map('map').setView([44.4300, 24.3700], 14);
console.log("HARTA PORNITA");

// HARTA OPENSTREETMAP

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
}).addTo(map);


// TEST STAȚIA GARA

let gara = L.marker([
    44.4300,
    24.3700
])
.addTo(map)
.bindPopup("🚕 Stația GARA")
.openPopup();


// CLICK PE STAȚII

const statii = {

    "GARA": {
        lat: 44.119591,
        lng: 24.364296
    },

    "BCR": {
        lat: 44.116599,
        lng: 24.351951
    },

    "HCC": {
        lat: 44.111158,
        lng: 24.353773
    },

    "STATIA2": {
        lat: 44.111704,
        lng: 24.351611
    },

    "STATIA1": {
        lat: 44.113206,
        lng: 24.351021
    },

    "STATIA3": {
        lat: 44.111792,
        lng: 24.348703
    },

    "TÂRGU VECHI": {
        lat: 44.115156,
        lng: 24.346476
    },

    "ELENA DOAMNA": {
        lat: 44.107382,
        lng: 24.328650
    },

    "REZI": {
        lat: 44.107616,
        lng: 24.343596
    },

    "PARC": {
        lat: 44.112150,
        lng: 24.344123
    }

};


let markerStatie;


document.querySelectorAll(".statie").forEach(statie => {

    statie.onclick = function(){

        let nume = this.querySelector("h3").innerText;


        let locatie = statii[nume];


        if(locatie){

            if(markerStatie){
                map.removeLayer(markerStatie);
            }


            markerStatie = L.marker([
                locatie.lat,
                locatie.lng
            ])
            .addTo(map)
            .bindPopup("🚕 Stația " + nume)
            .openPopup();


            map.setView([
                locatie.lat,
                locatie.lng
            ],16);


        } else {

            alert("Nu avem coordonate pentru stația " + nume);

        }

    }

});
// AFISARE MASINI IN STATII

const socket = io();

socket.on("actualizare_statii", function(statii){

    console.log("AM PRIMIT:", statii);

    document.querySelectorAll(".statie").forEach(function(cutie){

        let nume = cutie.querySelector("h3").innerText;

        let zona = cutie.querySelector(".masini");

        zona.innerHTML = "";

        let cod = nume
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .replaceAll(" ","_");

        if(statii[cod]){

            statii[cod].forEach(function(masina){

                let div = document.createElement("div");

                div.className="masina";

                div.innerHTML="🚕 "+masina;

                zona.appendChild(div);

            });

        }

    });

});

socket.on("connect", ()=>{
    console.log("DISPECERAT CONECTAT", socket.id);
});
// TRIMITERE COMANDA DISPECERAT

document.getElementById("trimite").onclick = function(){

    let adresa = document.getElementById("adresa").value;
    let destinatie = document.getElementById("destinatie").value;
    let telefon = document.getElementById("telefon").value;
    let observatii = document.getElementById("observatii").value;


    fetch("/adauga", {

        method:"POST",

        headers:{
            "Content-Type":"application/json"
        },

        body:JSON.stringify({

            plecare: adresa,
            destinatie: destinatie,
            telefon: telefon,
            observatii: observatii

        })

    })
    .then(r => r.text())
    .then(r => {

        console.log("RASPUNS SERVER:", r);

    });

};
socket.on("lista_comenzi", function(comenzi){

    const active=document.getElementById("comenziActive");
    const istoric=document.getElementById("istoricComenzi");

    active.innerHTML="";
    istoric.innerHTML="";

let nrActive = 0;
let nrIstoric = 0;



    comenzi.forEach(function(c,i){

        let card=document.createElement("div");

        card.className="cardComanda";

        card.innerHTML=`
            <div class="cardTitlu">
                🚖 #${i}
            </div>

            <div>
                📍 ${c.plecare}
            </div>

            <div class="cardStatus">
                ${c.status}
            </div>
        `;

        card.onclick=function(){

            document.getElementById("fundalDetalii").style.display="block";
            document.getElementById("detaliiComanda").style.display="block";

            document.getElementById("continutDetalii").innerHTML=`

<b>📍 Plecare</b><br>
${c.plecare}<br><br>

<b>🏁 Destinație</b><br>
${c.destinatie||"-"}<br><br>

<b>🚖 Șofer</b><br>
${c.indicativ||"-"}<br><br>
<b>🕒 Ora acceptării</b><br>
${c.oraAcceptare||"-"}<br><br>

<b>📞 Telefon</b><br>
${c.telefon||"-"}<br><br>

<b>📝 Observații</b><br>
${c.observatii||"-"}<br><br>

<b>📌 Status</b><br>
${c.status}

            `;

        };

if(
    c.status==="FINALIZATA" ||
    c.status==="ANULATA"
){

    nrIstoric++;
    istoric.prepend(card);

}else{

    nrActive++;
     active.prepend(card);

}

    });
            document.getElementById("nrActive").innerText = nrActive;
            document.getElementById("nrIstoric").innerText = nrIstoric;
});

// COMENZI ACTIVE

document.getElementById("btnActive").onclick = function () {

    const lista = document.getElementById("comenziActive");

    if (lista.style.display === "none" || lista.style.display === "") {
        lista.style.display = "block";
    } else {
        lista.style.display = "none";
    }

};

document.getElementById("btnIstoric").onclick = function () {

    const lista = document.getElementById("istoricComenzi");

    if (lista.style.display === "none" || lista.style.display === "") {
        lista.style.display = "block";
    } else {
        lista.style.display = "none";
    }

};



// ÎNCHIDE DIN BUTON

document.getElementById("inchideDetalii").onclick = function () {

    document.getElementById("fundalDetalii").style.display = "none";
    document.getElementById("detaliiComanda").style.display = "none";

};

