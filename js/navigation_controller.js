/* MAPO Analyzer — controlador único de navegación.
   app.js mantiene el estado del estudio; este controlador es la única capa de UI
   que dispara la navegación. multi_room.js solo cambia el estado/sala.
   study_io.js es el único propietario de Guardar/Cargar. */
(function(){'use strict';
 const $=id=>document.getElementById(id);
 const multi=()=>window.MAPOMultiRoom;
 const showError=e=>{const x=$('error');if(x){x.textContent=e?.message||String(e);x.hidden=false;}};
 function previous(){try{if(multi()?.state?.rooms?.length){multi().previousStep();return;}if(typeof window.saveStep!=='function'||typeof window.renderStep!=='function')throw Error('La navegación del estudio no está disponible.');window.saveStep();if(window.MAPO_CURRENT_STEP_GET){window.MAPO_CURRENT_STEP_SET(Math.max(0,window.MAPO_CURRENT_STEP_GET()-1));}else throw Error('No se ha inicializado el controlador de pasos.');window.renderStep();}catch(e){showError(e);}}
 function next(){try{if(multi()?.state?.rooms?.length){multi().nextStep();return;}if(typeof window.saveStep!=='function'||typeof window.renderStep!=='function')throw Error('La navegación del estudio no está disponible.');window.saveStep();if(window.MAPO_CURRENT_STEP_GET){const total=window.MAPO_TOTAL_STEPS?.()??0;if(window.MAPO_CURRENT_STEP_GET()<total-1)window.MAPO_CURRENT_STEP_SET(window.MAPO_CURRENT_STEP_GET()+1);}else throw Error('No se ha inicializado el controlador de pasos.');window.renderStep();}catch(e){showError(e);}}
 function bindStandard(){const p=$('previousStep'),n=$('nextStep');if(p){p.onclick=previous;p.dataset.navigationOwner='navigation_controller';}if(n){n.onclick=next;n.dataset.navigationOwner='navigation_controller';}}
 function bindRoomSetup(){const host=$('roomSetup');if(!host)return;let bar=$('roomSetupNavigation');if(!bar){bar=document.createElement('div');bar.id='roomSetupNavigation';bar.className='actions';bar.innerHTML='<button type="button" id="roomSetupBack" class="secondary">Anterior</button><button type="button" id="roomSetupSave" class="secondary">Guardar estudio</button><button type="button" id="roomSetupLoad" class="secondary">Cargar estudio</button><button type="button" id="roomSetupNext">Siguiente</button>';host.appendChild(bar);}
   $('roomSetupBack').onclick=()=>{window.MAPOMultiRoom?.state&&(window.MAPOMultiRoom.state.active=0);host.hidden=true;$('studySelection').hidden=false;};
   $('roomSetupSave').onclick=()=>window.MAPOMultiRoom?.saveMultiStudy?.();
   $('roomSetupLoad').onclick=()=>$('loadMultiStudyFile')?.click();
   $('roomSetupNext').onclick=()=>{try{window.MAPOMultiRoom?.beginSelectedStudy?.(window.MAPOMultiRoom?.state?.study);if(!window.MAPOMultiRoom?.state?.study)throw Error('Debe seleccionar un tipo de estudio.');}catch(e){showError(e);}};
 }
 function studySelection(){document.querySelectorAll('.study-option').forEach(b=>{if(b.dataset.navigationBound)return;b.dataset.navigationBound='1';b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();multi()?.openStudySetup?.(b.dataset.study);},true);});}
 function roomSetup(){const n=$('roomCount');if(n&&!n.dataset.navigationBound){n.dataset.navigationBound='1';const f=()=>multi()?.prepareRoomSetup?.();n.addEventListener('input',f);n.addEventListener('change',f);}if($('roomSetup')&&!$('roomSetup').hidden)multi()?.prepareRoomSetup?.();}
 function init(){bindStandard();studySelection();bindRoomSetup();roomSetup();}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
 window.MAPONavigation={previous,next,bindStandard,bindRoomSetup};
})();