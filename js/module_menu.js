/* MAPO Analyzer — navegación central del estudio. No contiene lógica de cálculo. */
(function(){
  'use strict';
  const modules=[
    ['patients','👥','Pacientes','Tipos de pacientes y distribución de la unidad.'],
    ['wheelchairs','♿','Sillas de ruedas','Disponibilidad y adecuación de sillas de ruedas.'],
    ['aids','🛠️','Ayudas','Ayudas técnicas y equipamiento disponible.'],
    ['mobilizations','🔄','Movilizaciones','Tareas y movilizaciones realizadas por turno.'],
    ['schedule','🕐','Horarios','Horarios, jornadas y personas presentes.'],
    ['hospitalization','🏥','Datos de hospitalización','Datos y factores específicos de la unidad.'],
    ['bathrooms','🚿','Baños / aseos','Condiciones y características de los aseos.'],
    ['results','📊','Resultados','Resultado MAPO y desglose de factores.']
  ];
  function findStep(key){
    if(!window.MAPO_STUDIES||!selectedStudy)return -1;
    const steps=MAPO_STUDIES[selectedStudy].steps;
    if(key==='schedule')return steps.findIndex(s=>s.shiftSchedule);
    if(key==='mobilizations')return steps.findIndex(s=>s.custom==='mobilizations');
    const groups={patients:'patients',wheelchairs:'wheelchairs',aids:'aids',bathrooms:'bathrooms'};
    if(groups[key])return steps.findIndex(s=>s.questionGroup===groups[key]);
    if(key==='hospitalization')return steps.findIndex(s=>s.title&&/hospitalizaci[oó]n/i.test(s.title));
    return -1;
  }
  function openModule(key){
    const menu=document.getElementById('moduleMenu'),panel=document.getElementById('studyPanel'),selection=document.getElementById('studySelection'),result=document.getElementById('result');
    if(!menu||!panel||!selection)return;
    menu.hidden=true;
    if(key==='results'){if(result)result.hidden=false;return;}
    if(!selectedStudy&&typeof selectStudy==='function')selectStudy('hospitalizacion');
    const index=findStep(key);
    currentStep=index>=0?index:0;
    selection.hidden=true;panel.hidden=false;if(result)result.hidden=true;
    if(typeof renderStep==='function')renderStep();
  }
  function render(){
    const grid=document.getElementById('moduleGrid');
    if(!grid)return;
    grid.innerHTML=modules.map(m=>`<button type="button" class="module-card" data-module="${m[0]}"><strong>${m[1]} ${m[2]}</strong><span>${m[3]}</span></button>`).join('');
    grid.querySelectorAll('[data-module]').forEach(b=>b.addEventListener('click',()=>openModule(b.dataset.module)));
  }
  function init(){
    const menu=document.getElementById('moduleMenu'),ident=document.getElementById('roomSetup');
    if(!menu||!ident)return;
    render();
    document.getElementById('startRooms')?.addEventListener('click',()=>{ident.hidden=true;menu.hidden=false;document.getElementById('studySelection').hidden=true;document.getElementById('studyPanel').hidden=true;document.getElementById('result').hidden=true;});
    document.getElementById('backToIdentification')?.addEventListener('click',()=>{menu.hidden=true;ident.hidden=false;});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.MAPOModuleMenu={openModule,render};
})();