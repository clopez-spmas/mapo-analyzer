/* MAPO: navegación de pestañas de horarios.
   Este módulo se carga después de workers_schedule_v3.js y utiliza
   directamente el controlador que V3 ya ha instalado en cada botón. */
(function(){
  function install(){
    const host=document.getElementById('formContainer');
    if(!host || host.dataset.workerNavigationFix==='1') return;
    host.dataset.workerNavigationFix='1';

    host.addEventListener('click',function(ev){
      const b=ev.target.closest('[data-v3-page]');
      if(!b || !host.contains(b)) return;

      /* V3 ya tiene el estado y la función correcta dentro de su cierre.
         Llamamos a su onclick real en vez de intentar acceder a variables
         internas que no están expuestas globalmente. */
      if(typeof b.onclick==='function'){
        ev.preventDefault();
        ev.stopImmediatePropagation();
        b.onclick();
      }
    },true);
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',install,{once:true});
  }else{
    install();
  }
})();