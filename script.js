/* ==========================================
   ALI WELEKHASIA WEBSITE
      script.js
      ========================================== */

      // Smooth scrolling for navigation links
      document.querySelectorAll('nav a').forEach(link => {
          link.addEventListener('click', function(e) {
                  const target = this.getAttribute('href');

                          if (target.startsWith('#')) {
                                      e.preventDefault();

                                                  document.querySelector(target).scrollIntoView({
                                                                  behavior: 'smooth'
                                                                              });
                                                                                      }
                                                                                          });
                                                                                          });

                                                                                          // Fade in sections on scroll
                                                                                          const sections = document.querySelectorAll("section");

                                                                                          const observer = new IntersectionObserver((entries) => {

                                                                                              entries.forEach(entry => {

                                                                                                      if(entry.isIntersecting){

                                                                                                                  entry.target.classList.add("show");

                                                                                                                          }

                                                                                                                              });

                                                                                                                              },{threshold:0.2});

                                                                                                                              sections.forEach(section=>{

                                                                                                                                  section.classList.add("hidden");

                                                                                                                                      observer.observe(section);

                                                                                                                                      });

                                                                                                                                      // Back To Top Button

                                                                                                                                      const topButton=document.createElement("button");

                                                                                                                                      topButton.innerHTML="↑";

                                                                                                                                      topButton.id="topBtn";

                                                                                                                                      document.body.appendChild(topButton);

                                                                                                                                      window.addEventListener("scroll",()=>{

                                                                                                                                      if(window.scrollY>400){

                                                                                                                                      topButton.style.display="block";

                                                                                                                                      }else{

                                                                                                                                      topButton.style.display="none";

                                                                                                                                      }

                                                                                                                                      });

                                                                                                                                      topButton.onclick=()=>{

                                                                                                                                      window.scrollTo({

                                                                                                                                      top:0,

                                                                                                                                      behavior:"smooth"

                                                                                                                                      });

                                                                                                                                      };

                                                                                                                                      // Contact Form

                                                                                                                                      const contactForm=document.querySelector(".contact-section form");

                                                                                                                                      if(contactForm){

                                                                                                                                      contactForm.addEventListener("submit",(e)=>{

                                                                                                                                      e.preventDefault();

                                                                                                                                      alert("Thank you for contacting Ali Welekhasia. We will get back to you soon.");

                                                                                                                                      contactForm.reset();

                                                                                                                                      });

                                                                                                                                      }

                                                                                                                                      // Prayer Form

                                                                                                                                      const prayerForm=document.querySelector(".prayer-section form");

                                                                                                                                      if(prayerForm){

                                                                                                                                      prayerForm.addEventListener("submit",(e)=>{

                                                                                                                                      e.preventDefault();

                                                                                                                                      alert("Thank you. Your prayer request has been received.");

                                                                                                                                      prayerForm.reset();

                                                                                                                                      });

                                                                                                                                      }