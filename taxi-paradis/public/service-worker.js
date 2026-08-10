self.addEventListener("install", (event) => {
    console.log("Service Worker instalat");
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    console.log("Service Worker activ");
});

self.addEventListener("fetch", (event) => {
    // Momentan nu cache-uim nimic.
});