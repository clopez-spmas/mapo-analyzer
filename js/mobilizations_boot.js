/* MAPO Analyzer — integración de movilizaciones.
   Fuente única de UI de movilizaciones: mobilizations.js.
   Este archivo solo conecta la pantalla de movilizaciones con renderStep/saveStep.
   NO crea pantallas adicionales ni modifica las fórmulas MAPO. */
(function(){
  const originalRenderStep=window.renderStep;
  const originalSaveStep=window.saveStep;

  window.MAPOMobilizationSelection={turn:null,category:null};

  window.renderStep=function(){
    const step=MAPO_STUDIES[selectedStudy]?.steps[currentStep];
    if(step?.custom==='mobilizations'){
      $('studyTitle').textContent=MAPO_STUDIES[selectedStudy].title;
      $('studyDescription').textContent=`${MAPO_STUDIES[selectedStudy].description} · Paso ${currentStep+1} de ${MAPO_STUDIES[selectedStudy].steps.length}: ${step.title}`;
      if(typeof window.renderMobilizations==='function') window.renderMobilizations();
      $('previousStep').hidden=true;
      $('nextStep').hidden=true;
      $('calculate').hidden=true;
      $('progressBar').style.width=`${(currentStep+1)/MAPO_STUDIES[selectedStudy].steps.length*100}%`;
      return;
    }
    originalRenderStep();
  };

  window.saveStep=function(){
    const step=MAPO_STUDIES[selectedStudy]?.steps[currentStep];
    if(step?.custom==='mobilizations'){
      if(typeof window.captureMobilizations==='function') window.captureMobilizations();
      return;
    }
    originalSaveStep();
  };
})();
