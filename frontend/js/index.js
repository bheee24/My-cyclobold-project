const menuBtn=document.querySelector("#menu-btn")

const navLinks=document.querySelector("#nav-links")

const menuBtnIcon=menuBtn.querySelector("i")

menuBtn.addEventListener("click",(e)=>{
    navLinks.classList.toggle("open");
    
    const isOpen=navLinks.classList.contains("open");
    menuBtnIcon.setAttribute("class",isOpen ?"ri-close-line":"ri-menu-line")
})
navLinks.addEventListener("click",(e)=>{
    navLinks.classList.remove("open");
    menuBtnIcon.setAttribute("class","ri-menu-line")
})

const ScrollRevealOption={
    origin:"bottom",
    distance:"50px",
    duration:1000,
}

ScrollReveal().reveal(".header_image img",{
    ...scrollRevealOption,
    origin:"right",
})

ScrollReveal().reveal(".header_image h1",{
    ...scrollRevealOption,
    delay:500,
})
scrollReveal().reveal(".header_content p",{
    ...scrollRevealOption,
    delay:1000,
})
ScrollReveal().reveal(".header_btns",{
    ...scrollRevealOption,
    delay:1500,
})
const banner=document.querySelector(".banner_container")

const bannerContent=Array.from(banner.children)

bannerContent.forEach(item=>{
    const duplicateNode=item.cloneNode(true)
    duplicateNode.setAttribute("aria-hidden",true);
    banner.appendChild(duplicateNode);
})

ScrollReveal().reveal(".arrival_card",{
    ...scrollRevealOption,
    interval:500,
})

ScrollReveal().reveal(".sale_image img",{
    ...scrollRevealOption,
    origin:"left",
})

ScrollReveal().reveal(".sale_content h2",{
    ...scrollRevealOption,
    delay:500,
})

ScrollReveal().reveal(".sale_content p",{
    ...scrollRevealOption,
  delay:1000,
})

ScrollReveal().reveal(".sale_content h4",{
    ...scrollRevealOption,
  delay:1000,
})

ScrollReveal().reveal(".sale_btn",{
    ...scrollRevealOption,
   delay:1500,
})

ScrollReveal().reveal(".favourite_card",{
    ...scrollRevealOption,
   interval:500,
})
button.addEventListener('click', async () => {
  let cart = await localforage.getItem("cart") || [];

  const exists = cart.some(item => item.id === product.id);
  if (!exists) {
    cart.push(product);
    await localforage.setItem("cart", cart);
    alert(`${product.name} added to cart!`);
  } else {
    alert(`${product.name} is already in the cart.`);
  }
});

