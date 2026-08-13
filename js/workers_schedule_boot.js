/* MAPO — puente de arranque de la pantalla de horarios. */
(function(){
  let forcing=false;
  function looksLikeWorkerStep(){
    const host=document.getElementById('formContainer');
    if(!host) return false;
    return !!host.querySelector('.schedule-block,.schedule-row,.schedule-table');
  }
  function forceV3(){
    if(forcing || !looksLikeWorkerStep() || typeof window.renderStep!=='function') return;
    forcing=true;
    try { window.renderStep(); } finally { setTimeout(function(){forcing=false;},0); }
  }
  function start(){
    const host=document.getElementById('formContainer');
    if(!host) return;
    const observer=new MutationObserver(function(){ forceV3(); });
    observer.observe(host,{childList:true,subtree:true});
    document.addEventListener('click',function(){ setTimeout(forceV3,20); },true);
    setTimeout(forceV3,100);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start);
  else start();
})();