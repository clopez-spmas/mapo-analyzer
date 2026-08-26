/* MAPO Analyzer — controlador único de navegación.
   Regla: un único dueño de Anterior/Siguiente; study_io.js es dueño de Guardar/Cargar.
   multi_room.js mantiene el estado de salas. module_navigator.js solo presenta movilizaciones. */
(function(){'use strict';
 const $=id=>document.getElementById(id);
 const multi=()=>window.MAPOMultiRoom;
 function error(e){const x=$('error');if(x){x.textContent=e?.message||String(e);x.hidden=false;}}
 function previous(){try{if(multi()?.state?.rooms?.length){multi().previousStep();return;}saveStep();if(currentStep>0)currentStep--;renderStep();}catch(e){error(e);}}
 function next(){try{if(multi()?.state?.rooms?.length){multi().nextStep();return;}saveStep();const total=MAPO_STUDIES[selectedStudy].steps.length;if(currentStep<total-1)currentStep++;renderStep();}catch(e){error(e);}}
 function bindStandard(){const p=$('previousStep'),n=$('nextStep');if(p){p.onclick=previous;p.dataset.navigationOwner='navigation_controller';}if(n){n.onclick=next;n.dataset.navigationOwner='navigation_controller';}}
 function studySelection(){document.querySelectorAll('.study-option').forEach(b=>{if(b.dataset.navigationBound)return;b.dataset.navigationBound='1';b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();multi()?.openStudySetup?.(b.dataset.study);},true);});}
 function roomSetup(){const n=$('roomCount');if(n&&!n.dataset.navigationBound){n.dataset.navigationBound='1';n.addEventListener('input',()=>multi()?.prepareRoomSetup?.());n.addEventListener('change',()=>multi()?.prepareRoomSetup?.());}if($('roomSetup')&&!$('roomSetup').hidden)multi()?.prepareRoomSetup?.();}
 function init(){bindStandard();studySelection();roomSetup();}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
 window.MAPONavigation={previous,next,bindStandard};
})();