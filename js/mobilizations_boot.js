/* Integración de tareas de movilización en Hospitalización. Se carga después de app.js. */
(function(){
  const study=MAPO_STUDIES.hospitalizacion;
  if(!study.steps.some(s=>s.custom==='mobilizations')) study.steps.splice(3,0,{title:'Tareas de movilización de pacientes',custom:'mobilizations'});
  const originalRenderStep=renderStep,originalSaveStep=saveStep,originalRenderMobilizations=renderMobilizations;
  window.MAPOMobilizationSelection={turn:null,category:null};
  document.addEventListener('click',e=>{
    const turnButton=e.target.closest?.('[data-mob-turn]');
    if(turnButton){window.MAPOMobilizationSelection.turn=Number(turnButton.dataset.mobTurn);window.MAPOMobilizationSelection.category=null;return;}
    const categoryButton=e.target.closest?.('[data-mob-category]');
    if(categoryButton)window.MAPOMobilizationSelection.category=Number(categoryButton.dataset.mobCategory);
  },true);
  function filterSelectedMobilization(){
    const sel=window.MAPOMobilizationSelection||{};
    if(sel.turn===null||sel.category===null)return;
    const selectedKind=['ta','pa','tm','pm'][sel.category];
    document.querySelectorAll('#formContainer .task-block').forEach(block=>block.querySelectorAll('.task-shift').forEach(shift=>{
      const isTurn=Number(shift.querySelector('[data-shift]')?.dataset.shift)===sel.turn;
      shift.hidden=!isTurn;
      if(isTurn)shift.querySelectorAll('label').forEach(label=>{const input=label.querySelector('input[data-kind]');if(input)label.hidden=input.dataset.kind!==selectedKind;});
    }));
    const turns=['Mañana','Tarde','Noche'],labels=['Movilizaciones totales con ayuda','Movilizaciones parciales con ayuda','Movilizaciones totales sin ayuda','Movilizaciones parciales sin ayuda'],host=$('formContainer');
    host?.querySelector('.step-title-row')?.remove();
    if(host&&!host.querySelector('.mobilization-screen-title')){const title=document.createElement('div');title.className='mobilization-screen-title schedule-preview';title.innerHTML=`<strong>${labels[sel.category]} — turno de ${turns[sel.turn]}</strong><br><span>Solo se muestran los datos de esta combinación.</span>`;host.insertBefore(title,host.firstChild);}
  }
  window.renderMobilizations=function(){originalRenderMobilizations();filterSelectedMobilization();};
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
  window.saveStep=function(){const step=MAPO_STUDIES[selectedStudy]?.steps[currentStep];if(step?.custom==='mobilizations'){validateMobilizations();captureMobilizations();return;}originalSaveStep();};
})();
