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
  const originalCalculate=window.calculateHospitalizacionFactors;
  window.calculateHospitalizacionFactors=function(d){
    const result=originalCalculate(d);
    const wc=wheelchairTotals();
    const na=num(d.nc)+num(d.pc);
    const sufficient=wc.total>=na*.5;
    const fc=wc.pmsr<=1.33?(sufficient?.75:1):wc.pmsr<=2.66?(sufficient?1.12:1.5):(sufficient?1.5:2);
    result.fc=fc;
    result.details=result.details||{};
    result.details.pmsr=wc.pmsr;
    result.details.fcSufficient=sufficient;
    result.details.wheelchairCount=wc.total;
    return result;
  };
})();
