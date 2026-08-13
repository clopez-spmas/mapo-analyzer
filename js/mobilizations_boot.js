/* Integración de tareas de movilización en Hospitalización. Se carga después de app.js. */
(function(){
  const study=MAPO_STUDIES.hospitalizacion;
  if(!study.steps.some(s=>s.custom==='mobilizations')) study.steps.splice(3,0,{title:'Tareas de movilización de pacientes',custom:'mobilizations'});
  const originalRenderStep=renderStep;
  const originalSaveStep=saveStep;
  window.renderStep=function(){
    const step=MAPO_STUDIES[selectedStudy]?.steps[currentStep];
    if(step?.custom==='mobilizations'){
      $('studyTitle').textContent=MAPO_STUDIES[selectedStudy].title;
      $('studyDescription').textContent=`${MAPO_STUDIES[selectedStudy].description} · Paso ${currentStep+1} de ${MAPO_STUDIES[selectedStudy].steps.length}: ${step.title}`;
      renderMobilizations();
      $('previousStep').hidden=currentStep===0;$('nextStep').hidden=currentStep===MAPO_STUDIES[selectedStudy].steps.length-1;$('calculate').hidden=currentStep!==MAPO_STUDIES[selectedStudy].steps.length-1;$('progressBar').style.width=`${(currentStep+1)/MAPO_STUDIES[selectedStudy].steps.length*100}%`;
      return;
    }
    originalRenderStep();
  };
  window.saveStep=function(){
    const step=MAPO_STUDIES[selectedStudy]?.steps[currentStep];
    if(step?.custom==='mobilizations'){validateMobilizations();captureMobilizations();return;}
    originalSaveStep();
  };
})();
