/* MAPO: navegación de pestañas de horarios. Se ejecuta después de V3. */
(function(){
  function install(){
    const host=document.getElementById('formContainer');
    if(!host)return;
    host.addEventListener('click',function(ev){
      const b=ev.target.closest('[data-v3-page]');
      if(!b)return;
      ev.preventDefault();
      ev.stopPropagation();
      if(typeof window.renderWorkerScheduleV3==='function'){
        try{
          if(typeof saveInputs==='function')saveInputs();
        }catch(_e){}
        if(window.formData && window.formData.workerSchedule){
          window.formData.workerSchedule.page=b.dataset.v3Page;
        }
        window.renderWorkerScheduleV3();
      }
    },true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();