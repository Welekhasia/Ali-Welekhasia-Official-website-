/* ==========================================
   MOBILE HAMBURGER MENU
========================================== */

const hamburger = document.getElementById("hamburger");
const navbar = document.getElementById("navbar");

hamburger.addEventListener("click", () => {
    navbar.classList.toggle("active");
    hamburger.classList.toggle("active");
});

/* Close menu when a link is clicked */

document.querySelectorAll(".navbar a").forEach(link => {

    link.addEventListener("click", () => {

        navbar.classList.remove("active");
        hamburger.classList.remove("active");

    });

});