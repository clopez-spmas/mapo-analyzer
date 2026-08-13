/* MAPO — controlador único de la pantalla de horarios.
   No contiene la lógica de horarios: solo garantiza que V3 sea la vista activa. */
(function(){
  function isWorkerStep(){
    try {
      return !!(window.selectedStudy && window.currentStep !== undefined &&
        window.MAPO_STUDIES?.[window.selectedStudy]?.steps?.[window.currentStep]?.shiftSchedule);
    } catch(e){ return false; }
  }
  function activate(){
    if(!isWorkerStep() || typeof window.renderWorkerScheduleV3!=='function') return;
    window.renderWorkerScheduleV3();
  }
  function install(){
    if(typeof window.renderStep==='function' && !window.__mapoWorkerControllerInstalled){
      const original=window.renderStep;
      window.renderStep=function(){
        if(isWorkerStep() && typeof window.renderWorkerScheduleV3==='function'){
          window.renderWorkerScheduleV3();
          return;
        }
        return original.apply(this,arguments);
      };
      window.__mapoWorkerControllerInstalled=true;
    }
    activate();
  }
  const timer=setInterval(function(){
    install();
    if(window.__mapoWorkerControllerInstalled) clearInterval(timer);
  },25);
  setTimeout(function(){install();},500);
})();