/* MAPO — controlador de horarios. V3 es la única vista de horarios. */
(function(){
  let lastActivation=0;
  function isOldScheduleScreen(){
    const host=document.getElementById('formContainer');
    if(!host) return false;
    const text=host.textContent||'';
    return text.includes('Personas trabajadoras que realizan MMP') &&
           !!host.querySelector('.schedule-block');
  }
  function activate(){
    if(!isOldScheduleScreen()) return;
    if(typeof window.renderWorkerScheduleV3!=='function') return;
    if(Date.now()-lastActivation<100) return;
    lastActivation=Date.now();
    window.renderWorkerScheduleV3();
  }
  const observer=new MutationObserver(()=>activate());
  function install(){
    const host=document.getElementById('formContainer');
    if(host && !host.__mapoScheduleObserved){
      observer.observe(host,{childList:true,subtree:true});
      host.__mapoScheduleObserved=true;
    }
    activate();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);
  else install();
  setInterval(install,250);
})();