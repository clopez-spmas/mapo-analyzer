/* MAPO Analyzer — controlador único de navegación.
   RESPONSABILIDADES:
   - Anterior/Siguiente en todas las pantallas del estudio, incluidas las 12 pantallas de movilizaciones.
   - Transición identificación del estudio -> primera unidad.
   - Nunca genera una segunda navegación.
   multi_room.js mantiene el estado de las unidades.
   study_io.js mantiene Guardar/Cargar.
*/
(function(){'use strict';
 const $=id=>document.getElementById(id);
 const multi=()=>window.MAPOMultiRoom;
 const showError=e=>{const x=$('error');if(x){x.textContent=e?.message||String(e);x.hidden=false;}};
 function state(){const m=multi()?.state;return m&&Array.isArray(m.rooms)&&m.rooms.length?m:null;}
 function current(){const m=state();return m?Number(m.rooms[m.active]?.currentStep||0):0;}
 function total(){const s=window.selectedStudy;return s&&window.MAPO_STUDIES?.[s]?.steps?.length||10;}
 function previous(){try{const m=state();if(m){m.rooms[m.active].currentStep=current();if(current()>0)multi().previousStep();return;}if(typeof window.saveStep!=='function'||typeof window.renderStep!=='function')throw Error('La navegación del estudio no está disponible.');window.saveStep();const get=window.MAPO_CURRENT_STEP_GET;if(!get)throw Error('No se ha inicializado el controlador de pasos.');window.MAPO_CURRENT_STEP_SET(Math.max(0,get()-1));window.renderStep();}catch(e){showError(e);}}
 function next(){try{const m=state();if(m){m.rooms[m.active].currentStep=current();if(current()<total()-1)multi().nextStep();return;}if(typeof window.saveStep!=='function'||typeof window.renderStep!=='function')throw Error('La navegación del estudio no está disponible.');window.saveStep();const get=window.MAPO_CURRENT_STEP_GET;if(!get)throw Error('No se ha inicializado el controlador de pasos.');if(get()<total()-1)window.MAPO_CURRENT_STEP_SET(get()+1);window.renderStep();}catch(e){showError(e);}}
 function ensureBar(){const panel=$('studyPanel'),bar=$('legacyStepActions');if(!panel||!bar)return null;let p=$('previousStep'),n=$('nextStep');if(!p){p=document.createElement('button');p.id='previousStep';p.type='button';p.className='secondary';p.textContent='Anterior';bar.insertBefore(p,bar.firstChild);}if(!n){n=document.createElement('button');n.id='nextStep';n.type='button';n.textContent='Siguiente';bar.appendChild(n);}return {p,n};}
 function bindStandard(){const c=ensureBar();if(!c)return;const {p,n}=c;if(p.dataset.navigationOwner!=='navigation_controller'){p.onclick=previous;p.dataset.navigationOwner='navigation_controller';}if(n.dataset.navigationOwner!=='navigation_controller'){n.onclick=next;n.dataset.navigationOwner='navigation_controller';}const step=current(),last=total()-1;p.hidden=step<=0;n.hidden=step>=last;const calc=$('calculate');if(calc)calc.hidden=step!==last;window.MAPOStudyIO?.ensureControls?.();}
 function bindRoomSetup(){const host=$('roomSetup');if(!host)return;let bar=$('roomSetupNavigation');if(!bar){bar=document.createElement('div');bar.id='roomSetupNavigation';bar.className='actions';bar.innerHTML='<button type="button" id="roomSetupBack" class="secondary">Anterior</button><button type="button" id="roomSetupSave" class="secondary">Guardar estudio</button><button type="button" id="roomSetupLoad" class="secondary">Cargar estudio</button><button type="button" id="roomSetupNext">Siguiente</button>';host.appendChild(bar);}if($('roomSetupBack').dataset.navigationOwner!=='navigation_controller'){$('roomSetupBack').onclick=()=>{host.hidden=true;$('studySelection').hidden=false;};$('roomSetupBack').dataset.navigationOwner='navigation_controller';$('roomSetupSave').onclick=()=>multi()?.saveMultiStudy?.();$('roomSetupLoad').onclick=()=>$('loadMultiStudyFile')?.click();$('roomSetupNext').onclick=()=>{try{multi()?.beginSelectedStudy?.(multi()?.state?.study);if(!multi()?.state?.study)throw Error('Debe seleccionar un tipo de estudio.');}catch(e){showError(e);}};}}
 function studySelection(){document.querySelectorAll('.study-option').forEach(b=>{if(b.dataset.navigationBound)return;b.dataset.navigationBound='1';b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();multi()?.openStudySetup?.(b.dataset.study);},true);});}
 function roomSetup(){const n=$('roomCount');if(n&&!n.dataset.navigationBound){n.dataset.navigationBound='1';const f=()=>multi()?.prepareRoomSetup?.();n.addEventListener('input',f);n.addEventListener('change',f);}}
 function init(){bindStandard();studySelection();bindRoomSetup();roomSetup();const panel=$('studyPanel');if(panel){new MutationObserver(()=>{if(!$('studyPanel').hidden)bindStandard();}).observe(panel,{subtree:true,childList:true});}setInterval(()=>{if(!$('studyPanel')?.hidden)bindStandard();},250);}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
 window.MAPONavigation={previous,next,bindStandard,bindRoomSetup};
})();