/* MAPO Analyzer — navegación de movilizaciones.
   PRINCIPIO: app.js es el único propietario del estado y de la navegación general.
   Este módulo NO modifica currentStep, selectedStudy ni llama directamente a renderStep.
   Los botones específicos de movilizaciones delegan en los botones oficiales de app.js.
   study_io.js sigue siendo el único propietario de Guardar/Cargar. */
(function(){'use strict';
 const $=id=>document.getElementById(id);
 const TURNS=['Mañana','Tarde','Noche'];
 const CATS=[['aidedTotal','Movilizaciones totales con ayuda'],['aidedPartial','Movilizaciones parciales con ayuda'],['manualTotal','Movilizaciones totales sin ayuda'],['manualPartial','Movilizaciones parciales sin ayuda']];
 const state=window.MAPOMobilizationSelection||{turn:null,category:null}; window.MAPOMobilizationSelection=state;
 const capture=()=>{try{window.captureMobilizations?.()}catch(_){} };
 const clickOfficial=id=>{const b=$(id);if(!b)throw Error('No se ha encontrado el control de navegación oficial: '+id);b.click();};
 function loadStudy(){const f=$('loadMultiStudyFile')||$('loadStudyFile');if(!f)throw Error('No se ha encontrado el cargador de estudios.');f.click();}
 function saveStudy(){const b=$('saveStudy');if(!b)throw Error('No se ha encontrado el guardado de estudios.');b.click();}
 function standardNav(host){
   host.querySelector('#mobilizationStandardNavigation')?.remove();
   const bar=document.createElement('div');bar.id='mobilizationStandardNavigation';bar.className='actions mobilization-standard-navigation';
   bar.innerHTML='<button type="button" class="secondary" id="mobPrevious">Anterior</button><button type="button" class="secondary" id="mobSave">Guardar estudio</button><button type="button" class="secondary" id="mobLoad">Cargar estudio</button><button type="button" id="mobNext">Siguiente</button>';
   host.appendChild(bar);
   // Delegación: los botones visuales NO tienen lógica propia. App.js conserva toda la lógica.
   $('mobPrevious').onclick=()=>{try{capture();clickOfficial('previousStep');}catch(e){showError(e);}};
   $('mobNext').onclick=()=>{try{capture();clickOfficial('nextStep');}catch(e){showError(e);}};
   $('mobSave').onclick=()=>{try{saveStudy();}catch(e){showError(e);}};
   $('mobLoad').onclick=()=>{try{loadStudy();}catch(e){showError(e);}};
 }
 function showError(e){const x=$('error');if(x){x.textContent=e?.message||String(e);x.hidden=false;}}
 function menu(){
   const h=$('formContainer');if(!h)return;
   h.innerHTML=`<div class="step-title-row"><h3>Tareas de movilización de pacientes</h3><p class="schedule-preview">Seleccione primero un turno y después una de las cuatro opciones. Solo se mostrará la combinación seleccionada.</p></div><div class="mobilization-navigation"><h4>Seleccione un turno</h4><div class="mobilization-turn-buttons">${TURNS.map((x,i)=>`<button type="button" class="secondary mob-turn-btn" data-turn="${i}">${x}</button>`).join('')}</div><div id="mobilizationOptions" class="mobilization-options" hidden></div></div>`;
   h.querySelectorAll('[data-turn]').forEach(b=>b.onclick=()=>cats(+b.dataset.turn));
   standardNav(h);
 }
 function cats(turn){
   state.turn=turn;state.category=null;const b=$('mobilizationOptions');if(!b)return;
   b.hidden=false;b.innerHTML=`<h4>Turno de ${TURNS[turn]}</h4><p>Seleccione una de las cuatro categorías.</p><div class="mobilization-option-grid">${CATS.map((c,i)=>`<button type="button" class="module-hub-item" data-cat="${i}"><strong>${c[1]}</strong><small>Turno de ${TURNS[turn]}</small></button>`).join('')}</div>`;
   b.querySelectorAll('[data-cat]').forEach(x=>x.onclick=()=>select(turn,+x.dataset.cat));
   standardNav(document.getElementById('formContainer'));
 }
 function categoryButtons(host){
   host.querySelector('#mobilizationCategoryNav')?.remove();const box=document.createElement('div');box.id='mobilizationCategoryNav';box.className='mobilization-category-nav';
   box.innerHTML=`<div class="schedule-preview"><strong>Otras movilizaciones del turno de ${TURNS[state.turn]}</strong><div class="actions mobilization-category-actions">${CATS.map((c,i)=>`<button type="button" class="secondary ${i===state.category?'active':''}" data-mob-cat="${i}">${c[1]}</button>`).join('')}</div></div>`;
   host.appendChild(box);box.querySelectorAll('[data-mob-cat]').forEach(b=>b.onclick=()=>{capture();state.category=+b.dataset.mobCat;renderSelected();});
 }
 function select(turn,cat){capture();state.turn=turn;state.category=cat;renderSelected();}
 function renderSelected(){
   if(state.turn===null||state.category===null)return;const h=$('formContainer');if(!h||typeof window.renderMobilizations!=='function')return;
   window.renderMobilizations(CATS[state.category][0],state.turn);
   const title=document.createElement('div');title.className='schedule-preview mobilization-selection-title';title.innerHTML=`<strong>${CATS[state.category][1]} — turno de ${TURNS[state.turn]}</strong>`;h.insertBefore(title,h.firstChild);
   categoryButtons(h);
   const a=document.createElement('div');a.id='mobilizationSubNavigation';a.className='actions';a.innerHTML='<button type="button" class="secondary" id="selectAnotherMobilizationTurn">Seleccionar otro turno</button>';h.appendChild(a);
   $('selectAnotherMobilizationTurn').onclick=()=>{capture();state.turn=null;state.category=null;menu();};
   standardNav(h);
 }
 function refresh(){if(!isMob())return;if(state.turn===null||state.category===null)menu();else renderSelected();}
 function isMob(){const d=$('studyDescription');return !!(d&&/Tareas de movilización/i.test(d.textContent||''));}
 function installRenderHook(){
   if(typeof window.renderStep!=='function'||window.renderStep.__mapoMobHook)return;
   const original=window.renderStep;
   function hooked(){original.apply(this,arguments);if(isMob())setTimeout(refresh,0);}
   hooked.__mapoMobHook=true;window.renderStep=hooked;
 }
 function init(){installRenderHook();setTimeout(refresh,0);}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
 window.MAPOModuleNavigator={refresh,renderMobilizationSelector:menu};
})();