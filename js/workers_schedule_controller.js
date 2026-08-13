/* MAPO — controlador único del paso de horarios.
   Solo garantiza que V3 controle el renderizado de ese paso. */
(function(){
  function isWorkerStep(){
    try{
      return typeof selectedStudy !== 'undefined' &&
             typeof currentStep !== 'undefined' &&
             typeof MAPO_STUDIES !== 'undefined' &&
             !!selectedStudy &&
             !!MAPO_STUDIES[selectedStudy] &&
             !!MAPO_STUDIES[selectedStudy].steps[currentStep] &&
             MAPO_STUDIES[selectedStudy].steps[currentStep].shiftSchedule === true;
    }catch(e){ return false; }
  }

  function install(){
    if(typeof window.renderWorkerScheduleV3 !== 'function') return false;
    if(typeof window.renderStep !== 'function') return false;

    if(!window.__mapoV3OriginalRenderStep){
      window.__mapoV3OriginalRenderStep=window.renderStep;
      window.renderStep=function(){
        if(isWorkerStep()){
          window.renderWorkerScheduleV3();
          const study=MAPO_STUDIES[selectedStudy];
          const pb=document.getElementById('progressBar');
          if(pb&&study) pb.style.width=((currentStep+1)/study.steps.length*100)+'%';
          return;
        }
        return window.__mapoV3OriginalRenderStep.apply(this,arguments);
      };
    }

    if(isWorkerStep()) window.renderWorkerScheduleV3();
    return true;
  }

  let attempts=0;
  const timer=setInterval(()=>{
    attempts++;
    if(install()||attempts>=100) clearInterval(timer);
  },50);
  if(document.readyState!=='loading') install();
  else document.addEventListener('DOMContentLoaded',install,{once:true});
})();