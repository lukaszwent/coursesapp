
            (function(){
         let barFillHeight = document.querySelectorAll(".prog");
         let allBars = document.querySelectorAll(".progressBar")
         for(let i=0;i<barFillHeight.length;i++){
            allBars[i].style.setProperty('--my-end-width', barFillHeight[i].textContent);
         }
          
         })()