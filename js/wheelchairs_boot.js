/* Integra el registro de sillas en el flujo existente de Hospitalización. */
(function(){
  const originalRenderStep=window.renderStep;
  window.renderStep=function(){
    const study=MAPO_STUDIES[selectedStudy],step=study.steps[currentStep];
    if(step && step.custom==='wheelchairs'){
      $('studyTitle').textContent=study.title;
      $('studyDescription').textContent=`${study.description} · Paso ${currentStep+1} de ${study.steps.length}: ${step.title}`;
      renderWheelchairs();
      $('previousStep').hidden=currentStep===0;
      $('nextStep').hidden=currentStep===study.steps.length-1;
      $('calculate').hidden=currentStep!==study.steps.length-1;
      $('progressBar').style.width=`${(currentStep+1)/study.steps.length*100}%`;
      return;
    }
    return originalRenderStep();
  };
  const originalSaveStep=window.saveStep;
  window.saveStep=function(){
    const study=MAPO_STUDIES[selectedStudy],step=study.steps[currentStep];
    if(step && step.custom==='wheelchairs'){
      captureWheelchairs();
      validateWheelchairs();
      return;
    }
    return originalSaveStep();
  };
})();
