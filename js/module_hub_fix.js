/* MAPO Analyzer — pantalla de accesos directos a módulos. Solo navegación/presentación. */
(function(){'use strict';
 const $=id=>document.getElementById(id);
 function renderHub(){
   const hub=$('moduleHub');
   if(!hub)return;
   const study=window.MAPO_STUDIES?.[window.selectedStudy];
   if(!study||!Array.isArray(study.steps))return;
   const steps=study.steps;
   hub.innerHTML='<div class="section-heading"><div><h2>Accesos directos a los módulos</h2><p>Seleccione directamente el módulo que desea revisar o completar.</p></div></div><div class="module-hub-grid">'+steps.map((s,i)=>`<button type="button" class="module-hub-item" data-hub-step="${i}"><span>Módulo ${i+1}</span><strong>${s.title}</strong></button>`).join('')+'</div><div class="actions"><button type="button" id="hubBackToIdentification" class="secondary">Volver a identificación</button></div>';
   hub.querySelectorAll('[data-hub-step]').forEach(b=>b.onclick=()=>{
     try{
       const step=Number(b.dataset.hubStep);
       const m=window.MAPOMultiRoom?.state;
       if(m?.rooms?.[m.active])m.rooms[m.active].currentStep=step;
       window.currentStep=step;
       const panel=$('studyPanel');
       hub.hidden=true;
       if(panel)panel.hidden=false;
       window.renderStep?.();
       window.MAPONavigation?.bindStandard?.();
     }catch(e){const x=$('error');if(x){x.textContent=e.message;x.hidden=false;}}
   });
   $('hubBackToIdentification').onclick=()=>{hub.hidden=true;$('roomSetup').hidden=false;};
   hub.hidden=false;
 }
 function install(){
   const api=window.MAPOMultiRoom;if(!api||api.__hubFixInstalled)return;
   const original=api.beginSelectedStudy;
   if(typeof original!=='function')return;
   api.beginSelectedStudy=function(key){
     const m=api.state;if(!m?.rooms?.length)return original.call(this,key);
     const r=m.rooms[m.active];
     m.study=key||m.study;
     window.selectedStudy=m.study;
     window.currentStep=Number(r.currentStep)||0;
     window.formData=JSON.parse(JSON.stringify(r.formData||{}));
     window.lastResult=r.lastResult?JSON.parse(JSON.stringify(r.lastResult)):null;
     $('studySelection').hidden=true;$('roomSetup').hidden=true;$('studyPanel').hidden=true;$('result').hidden=true;$('globalResults').hidden=true;$('moduleHub').hidden=false;
     renderHub();
   };
   api.__hubFixInstalled=true;
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,0));else setTimeout(install,0);
})();