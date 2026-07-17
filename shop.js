let cart = [];
let total = 0;

function addToCart(name, price){

cart.push({name:name, price:price});

total += price;

updateCart();

}

function updateCart(){

const cartItems = document.getElementById("cart-items");

const cartTotal = document.getElementById("cart-total");

cartItems.innerHTML = "";

if(cart.length === 0){

cartItems.innerHTML = "<p>Your cart is currently empty.</p>";

}else{

cart.forEach(function(item){

cartItems.innerHTML += `

<p>

${item.name} - KSh ${item.price}

</p>

`;

});

}

cartTotal.innerHTML = total;

}

function clearCart(){

cart=[];

total=0;

updateCart();

}

function checkout(){

if(cart.length===0){

alert("Your cart is empty.");

}else{

alert("Checkout and M-Pesa integration will be activated in the live version.");

}

}