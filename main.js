/* ==========================================
   MAIN WEBSITE SCRIPT
========================================== */

/* Change Header Background While Scrolling */

const header = document.querySelector(".header");

window.addEventListener("scroll", () => {

    if (window.scrollY > 80) {

        header.style.background = "rgba(0,0,0,.95)";
        header.style.boxShadow = "0 10px 30px rgba(0,0,0,.4)";

    } else {

        header.style.background = "rgba(0,0,0,.35)";
        header.style.boxShadow = "none";

    }

});

/* Current Year in Footer */

const year = new Date().getFullYear();

const copyright = document.querySelector(".copyright");

if(copyright){

copyright.innerHTML =
`© ${year} Ali Welekhasia. All Rights Reserved.`;

}