/* MAPO Analyzer — navegación especial de movilizaciones.
   app.js es el único propietario de Anterior/Siguiente.
   study_io.js es el único propietario de Guardar/Cargar.
   Este módulo SOLO controla turno/tipo y las cuatro categorías del turno activo. */
(function(){'use strict';
 const $=id=>document.getElementById(id);
 const TURNS=['Mañana','Tarde','Noche'];
 const CATS=[['aidedTotal','Movilizaciones totales con ayuda'],['aidedPartial','Movilizaciones parciales con ayuda'],['manualTotal','Movilizaciones totales sin ayuda'],['manualPartial','Movilizaciones parciales sin ayuda']];
 const state=window.MAPOMobilizationSelection||{turn:null,category:null}; window.MAPOMobilizationSelection=state;
 const isMob=()=>{const d=$('studyDescription');return !!(d&&/Tareas de movilización/i.test(d.textContent||''));};
 const capture=()=>{try{window.captureMobilizations?.()}catch(_){} };
 function showStandardNavigation(){
   const study=window.MAPO_STUDIES?.[window.selectedStudy];
   const total=study?.steps?.length||99;
   const step=Number(window.currentStep||0);
   // app.js owns these elements; this module only restores visibility after rendering a mobilization.
   const prev=$('previousStep'),next=$('nextStep'),calc=$('calculate');
   if(prev)prev.hidden=step<=0;
   if(next)next.hidden=step>=total-1;
   if(calc)calc.hidden=step!==total-1;
   const io=$('studyIO');if(io)io.hidden=false;
 }
 function menu(){const h=$('formContainer');if(!h)return;h.innerHTML=`<div class="step-title-row"><h3>Tareas de movilización de pacientes</h3><p class="schedule-preview">Seleccione primero un turno y después una de las cuatro opciones. Solo se mostrará la combinación seleccionada.</p></div><div class="mobilization-navigation"><h4>Seleccione un turno</h4><div class="mobilization-turn-buttons">${TURNS.map((x,i)=>`<button type="button" class="secondary mob-turn-btn" data-turn="${i}">${x}</button>`).join('')}</div><div id="mobilizationOptions" class="mobilization-options" hidden></div></div>`;h.querySelectorAll('[data-turn]').forEach(b=>b.onclick=()=>cats(+b.dataset.turn));showStandardNavigation();}
 function cats(turn){state.turn=turn;state.category=null;const b=$('mobilizationOptions');if(!b)return;b.hidden=false;b.innerHTML=`<h4>Turno de ${TURNS[turn]}</h4><p>Seleccione una de las cuatro categorías.</p><div class="mobilization-option-grid">${CATS.map((c,i)=>`<button type="button" class="module-hub-item" data-cat="${i}"><strong>${c[1]}</strong><small>Turno de ${TURNS[turn]}</small></button>`).join('')}</div>`;b.querySelectorAll('[data-cat]').forEach(x=>x.onclick=()=>select(turn,+x.dataset.cat));}
 function categoryButtons(host){host.querySelector('#mobilizationCategoryNav')?.remove();const box=document.createElement('div');box.id='mobilizationCategoryNav';box.className='mobilization-category-nav';box.innerHTML=`<div class="schedule-preview"><strong>Otras movilizaciones del turno de ${TURNS[state.turn]}</strong><div class="actions mobilization-category-actions">${CATS.map((c,i)=>`<button type="button" class="secondary ${i===state.category?'active':''}" data-mob-cat="${i}">${c[1]}</button>`).join('')}</div></div>`;host.appendChild(box);box.querySelectorAll('[data-mob-cat]').forEach(b=>b.onclick=()=>{capture();state.category=+b.dataset.mobCat;renderSelected();});}
 function select(turn,cat){capture();state.turn=turn;state.category=cat;renderSelected();}
 function renderSelected(){if(!isMob()||state.turn===null||state.category===null)return;const h=$('formContainer');if(!h||typeof window.renderMobilizations!=='function')return;window.renderMobilizations(CATS[state.category][0],state.turn);const title=document.createElement('div');title.className='schedule-preview mobilization-selection-title';title.innerHTML=`<strong>${CATS[state.category][1]} — turno de ${TURNS[state.turn]}</strong>`;h.insertBefore(title,h.firstChild);categoryButtons(h);const a=document.createElement('div');a.id='mobilizationSubNavigation';a.className='actions';a.innerHTML='<button type="button" class="secondary" id="selectAnotherMobilizationTurn">Seleccionar otro turno</button>';h.appendChild(a);$('selectAnotherMobilizationTurn').onclick=()=>{capture();state.turn=null;state.category=null;menu();};showStandardNavigation();}
 function refresh(){if(!isMob())return;if(state.turn===null||state.category===null)menu();else renderSelected();}
 function init(){setTimeout(refresh,0);}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init(); window.MAPOModuleNavigator={refresh,renderMobilizationSelector:menu};
})();