/* Correcciones de interacción MAPO. No modifica OCRA ni fórmulas MAPO. */
(function(){
  function forceNavigation(){
    try{
      if(typeof selectedStudy==='undefined'||typeof currentStep==='undefined')return;
      const study=MAPO_STUDIES?.[selectedStudy];
      if(!study)return;
      const last=study.steps.length-1;
      const prev=document.getElementById('previousStep');
      const next=document.getElementById('nextStep');
      const calc=document.getElementById('calculate');
      if(prev)prev.hidden=currentStep<=0;
      if(next)next.hidden=currentStep>=last;
      if(calc)calc.hidden=currentStep!==last;
    }catch(e){console.error('MAPO navegación:',e);}
  }
  function bindSimulation(){
    const b=document.getElementById('openMapoSimulation');
    if(!b)return;
    if(b.__mapoSimulationBound)return;
    b.__mapoSimulationBound=true;
    b.onclick=null;
    b.addEventListener('click',function(e){
      e.preventDefault();e.stopPropagation();
      try{
        if(typeof MAPOSimulation!=='undefined'&&typeof MAPOSimulation.open==='function'){
          MAPOSimulation.open();
          return;
        }
        const host=document.getElementById('mapoSimulation');
        if(host){host.hidden=false;host.innerHTML='<div class="error">No se ha cargado el módulo de simulación.</div>';host.scrollIntoView({behavior:'smooth',block:'start'});}
      }catch(err){
        console.error('MAPO simulación:',err);
        const host=document.getElementById('mapoSimulation');
        if(host){host.hidden=false;host.innerHTML='<div class="error">No se ha podido abrir la simulación: '+String(err.message||err)+'</div>';host.scrollIntoView({behavior:'smooth',block:'start'});}
      }
    });
  }
  function init(){
    forceNavigation();bindSimulation();
    const observer=new MutationObserver(()=>{forceNavigation();bindSimulation();});
    observer.observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
