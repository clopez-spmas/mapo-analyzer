/* MAPO Analyzer — capa final de compatibilidad de botones.
   No contiene cálculos MAPO. Evita que los módulos de UI que envuelven la navegación
   dejen botones sin comportamiento después de re-renderizar una pantalla. */
(function(){
  function showError(message){
    const e=document.getElementById('error');
    if(e){e.textContent=message;e.hidden=false;}
    else console.error(message);
  }

  // El simulador debe fallar de forma visible, nunca como un botón aparentemente muerto.
  window.openMapoSimulationSafe=function(){
    try{
      if(!window.MAPOSimulation||typeof window.MAPOSimulation.open!=='function')
        throw new Error('No se ha cargado el módulo de simulación MAPO. Recargue la página.');
      window.MAPOSimulation.open();
    }catch(e){showError('No se pudo abrir la simulación: '+(e?.message||e));}
  };

  // Reforzar los botones de ayuda y de cálculo parcial cada vez que una pantalla es renderizada.
  function bindDynamicButtons(){
    document.querySelectorAll('.help-trigger').forEach(btn=>{
      if(btn.dataset.finalButtonFix==='1')return;
      btn.dataset.finalButtonFix='1';
      btn.addEventListener('click',function(){
        // Los módulos originales ya gestionan estos botones. Este listener solo garantiza
        // que un botón dinámico tenga un feedback si su gestor no existe.
        try{
          const id=this.dataset.questionHelp?`qhelp_${this.dataset.questionHelp}`:this.dataset.help?`help_${this.dataset.help}`:this.id==='wcHelpBtn'?'wcHelp':this.id==='mobHelpBtn'?'mobHelp':this.dataset.taskHelp?'taskHelp':null;
          if(id&&!document.getElementById(id))showError('No se encontró la ayuda asociada a este botón.');
        }catch(e){showError('Error al abrir la ayuda: '+e.message);}
      },true);
    });

    document.querySelectorAll('[data-partial-factor]').forEach(btn=>{
      if(btn.dataset.finalButtonFix==='1')return;
      btn.dataset.finalButtonFix='1';
      btn.addEventListener('click',function(){
        const box=document.getElementById('partial_'+this.dataset.partialFactor);
        if(box&&!box.innerHTML.trim()){
          // El gestor original debe rellenarlo. Si no lo hizo, mostrar diagnóstico.
          setTimeout(()=>{if(!box.innerHTML.trim())showError('No se pudo realizar el cálculo parcial de '+this.dataset.partialFactor.toUpperCase()+'.');},0);
        }
      },true);
    });
  }

  // La navegación final puede haber sido reemplazada por multi_room.js. Antes de avanzar,
  // guardar/validar el paso actual. No sustituimos el onclick existente: lo envolvemos.
  function guardNavigation(){
    ['nextStep','previousStep','calculate'].forEach(id=>{
      const b=document.getElementById(id);
      if(!b||b.dataset.navigationFix==='1')return;
      b.dataset.navigationFix='1';
      b.addEventListener('click',function(){
        if(id==='calculate')return;
        // En la pantalla de baños la capa existente controla las subpantallas y cancela
        // el onclick; en las demás pantallas saveStep valida y conserva los datos.
        try{
          if(typeof window.saveStep==='function')window.saveStep();
        }catch(e){showError(e.message);}
      },true);
    });
  }

  function installObserver(){
    const fc=document.getElementById('formContainer');
    if(fc)new MutationObserver(()=>{bindDynamicButtons();guardNavigation();}).observe(fc,{childList:true,subtree:true});
    bindDynamicButtons();guardNavigation();
  }

  document.addEventListener('DOMContentLoaded',installObserver);
})();
