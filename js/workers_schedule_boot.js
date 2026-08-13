/* MAPO — puente de arranque de la pantalla de horarios.
   app.js contiene una implementación histórica que puede renderizar el paso
   directamente. Este puente fuerza la implementación V3 después de cualquier
   render del contenedor, sin modificar la lógica general de MAPO. */
(function(){
  function isWorkerStep(){
    return !!(window.MAPO_STUDIES && window.selectedStudy &&
      window.MAPO_STUDIES[window.selectedStudy] &&
      window.MAPO_STUDIES[window.selectedStudy].steps &&
      window.MAPO_STUDIES[window.selectedStudy].steps[window.currentStep] &&
      window.MAPO_STUDIES[window.selectedStudy].steps[window.currentStep].shiftSchedule);
  }
  let forcing=false;
  function forceV3(){
    if(forcing || !isWorkerStep() || typeof window.renderStep!=='function') return;
    forcing=true;
    try { window.renderStep(); } finally { setTimeout(function(){forcing=false;},0); }
  }
  function start(){
    const host=document.getElementById('formContainer');
    if(!host) return;
    const observer=new MutationObserver(function(){ forceV3(); });
    observer.observe(host,{childList:true,subtree:false});
    document.addEventListener('click',function(){ setTimeout(forceV3,0); },true);
    setTimeout(forceV3,50);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start);
  else start();
})();