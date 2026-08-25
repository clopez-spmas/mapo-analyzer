/* MAPO Analyzer — navegación especial de movilizaciones.
   NO crea ni oculta la navegación general. app.js controla Anterior/Siguiente.
   study_io.js controla Guardar/Cargar. Este módulo solo controla turno/tipo. */
(function(){'use strict';
 const $=id=>document.getElementById(id), TURNS=['Mañana','Tarde','Noche'], CATS=[
  ['aidedTotal','Movilizaciones totales con ayuda'],['aidedPartial','Movilizaciones parciales con ayuda'],
  ['manualTotal','Movilizaciones totales sin ayuda'],['manualPartial','Movilizaciones parciales sin ayuda']
 ];
 const state=window.MAPOMobilizationSelection||{turn:null,category:null}; window.MAPOMobilizationSelection=state;
 const isMob=()=>!!(window.selectedStudy&&window.MAPO_STUDIES?.[window.selectedStudy]?.steps?.[window.currentStep]?.custom==='mobilizations');
 const capture=()=>{try{window.captureMobilizations?.()}catch(_){} };
 function menu(){const h=$('formContainer');if(!h)return;h.innerHTML=`<div class="step-title-row"><h3>Tareas de movilización de pacientes</h3><p class="schedule-preview">Seleccione primero un turno y después una de las cuatro opciones. Solo se mostrará la combinación seleccionada.</p></div><div class="mobilization-navigation"><h4>Seleccione un turno</h4><div class="mobilization-turn-buttons">${TURNS.map((x,i)=>`<button type="button" class="secondary mob-turn-btn" data-turn="${i}">${x}</button>`).join('')}</div><div id="mobilizationOptions" class="mobilization-options" hidden></div></div>`;h.querySelectorAll('[data-turn]').forEach(b=>b.onclick=()=>cats(+b.dataset.turn));}
 function cats(turn){state.turn=turn;state.category=null;const b=$('mobilizationOptions');if(!b)return;b.hidden=false;b.innerHTML=`<h4>Turno de ${TURNS[turn]}</h4><div class="mobilization-option-grid">${CATS.map((c,i)=>`<button type="button" class="module-hub-item" data-cat="${i}"><strong>${c[1]}</strong><small>Turno de ${TURNS[turn]}</small></button>`).join('')}</div>`;b.querySelectorAll('[data-cat]').forEach(x=>x.onclick=()=>select(turn,+x.dataset.cat));}
 function select(turn,cat){capture();state.turn=turn;state.category=cat;renderSelected();}
 function renderSelected(){if(!isMob()||state.turn===null||state.category===null)return;const h=$('formContainer');if(!h||typeof window.renderMobilizations!=='function')return;window.renderMobilizations(CATS[state.category][0],state.turn);const title=document.createElement('div');title.className='schedule-preview mobilization-selection-title';title.innerHTML=`<strong>${CATS[state.category][1]} — turno de ${TURNS[state.turn]}</strong>`;h.insertBefore(title,h.firstChild);const a=document.createElement('div');a.id='mobilizationSubNavigation';a.className='actions';a.innerHTML='<button type="button" class="secondary" id="selectAnotherMobilizationTurn">Seleccionar otro turno</button>';h.appendChild(a);$('selectAnotherMobilizationTurn').onclick=()=>{capture();state.turn=null;state.category=null;menu();};}
 function refresh(){if(!isMob())return;if(state.turn===null||state.category===null)menu();else renderSelected();}
 function init(){const h=$('formContainer');if(h){new MutationObserver(()=>{if(isMob()&&!$('mobilizationOptions')&&!$('mobilizationSubNavigation'))refresh()}).observe(h,{childList:true});}document.addEventListener('click',e=>{if(isMob()&&e.target.closest('#nextStep,#previousStep'))capture()},true);setTimeout(refresh,0);}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
 window.MAPOModuleNavigator={refresh,renderMobilizationSelector:menu};
})();