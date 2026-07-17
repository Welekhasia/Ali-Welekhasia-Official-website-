/* ==========================================
   ALI WELEKHASIA MUSIC PLAYER
========================================== */

let currentSong = null;
let currentIndex = 0;

const playlist = [
"song1",
"song2",
"song3",
"song4",
"song5",
"song6",
"song7",
"song8",
"song9",
"song10",
"song11",
"song12",
"song13",
"song14"
];

function playSong(songId){

if(currentSong && currentSong.id!==songId){

currentSong.pause();

currentSong.currentTime=0;

}

currentSong=document.getElementById(songId);

currentSong.play();

currentIndex=playlist.indexOf(songId);

document.getElementById("player-title").innerHTML=currentSong.dataset.title;

}

function pauseSong(songId){

document.getElementById(songId).pause();

}

function stopSong(){

if(currentSong){

currentSong.pause();

currentSong.currentTime=0;

document.getElementById("player-title").innerHTML="No song playing";

}

}

function nextSong(){

currentIndex++;

if(currentIndex>=playlist.length){

currentIndex=0;

}

playSong(playlist[currentIndex]);

}

function previousSong(){

currentIndex--;

if(currentIndex<0){

currentIndex=playlist.length-1;

}

playSong(playlist[currentIndex]);

}

function changeVolume(value){

if(currentSong){

currentSong.volume=value/100;

}

}

function searchSongs(){

let input=document.getElementById("musicSearch");

let filter=input.value.toUpperCase();

let cards=document.getElementsByClassName("music-card");

for(let i=0;i<cards.length;i++){

let title=cards[i].getElementsByTagName("h3")[0];

if(title.innerHTML.toUpperCase().indexOf(filter)>-1){

cards[i].style.display="block";

}else{

cards[i].style.display="none";

}

}

}

function toggleLyrics(id){

const lyrics=document.getElementById(id);

if(lyrics.style.display==="block"){

lyrics.style.display="none";

}else{

lyrics.style.display="block";

}

}

playlist.forEach(function(song){

const audio=document.getElementById(song);

if(audio){

audio.addEventListener("ended",function(){

nextSong();

});

}

});
