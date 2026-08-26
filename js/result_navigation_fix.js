/* Corrección de navegación: permite volver a la evaluación y abrir de nuevo el resultado MAPO. No modifica cálculos. */
(function(){'use strict';
 function install(){
   const btn=document.getElementById('calculate');
   if(!btn||btn.dataset.resultNavigationFixed==='1')return;
   const original=btn.onclick;
   if(typeof original!=='function')return;
   btn.onclick=function(ev){
     original.call(this,ev);
     if(window.lastResult||typeof lastResult!=='undefined'&&lastResult){
       window.MAPOResultScreens?.showResult?.();
     }
   };
   btn.dataset.resultNavigationFixed='1';
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
