/* ==========================================
   GALLERY LIGHTBOX
========================================== */

const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");

function openLightbox(image){

lightbox.style.display="flex";

lightboxImg.src=image;

}

function closeLightbox(){

lightbox.style.display="none";

}

window.onclick=function(event){

if(event.target===lightbox){

closeLightbox();

}

}