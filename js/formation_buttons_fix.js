/* MAPO — corrección específica de la pantalla Factor formación (FF).
   No modifica fórmulas ni arquitectura. Reenlaza los controles de FF después de cada renderizado. */
(function(){
  const $=id=>document.getElementById(id);
  function isFF(){
    try{return selectedStudy==='hospitalizacion' && MAPO_STUDIES[selectedStudy].steps[currentStep].questionGroup==='ff';}
    catch(e){return false;}
  }
  function sync(){
    if(!isFF())return;
    document.querySelectorAll('#formContainer input').forEach(el=>{
      const id=el.dataset.field||el.id;
      if(!id)return;
      if(el.type==='radio'){if(el.checked)formData[id]=el.value==='yes';}
      else if(el.type==='number')formData[id]=el.value===''?'':Number(el.value);
    });
  }
  function help(btn){
    const id=btn.dataset.help;
    if(!id)return;
    const box=$('help_'+id);
    if(!box){const e=$('error');if(e){e.textContent='No se encontró la ayuda de formación.';e.hidden=false;}return;}
    const was=box.hidden;
    document.querySelectorAll('.help-popover,.question-help-popover').forEach(x=>x.hidden=true);
    box.hidden=!was;
  }
  function partial(){
    sync();
    const out=$('partial_ff');
    try{
      if(!out)throw Error('No se encontró el área de resultado del cálculo parcial de FF.');
      const f=window.calculateHospitalizacionFactors(formData);
      out.hidden=false;
      out.innerHTML='<strong>Factor formación (FF) = '+Number(f.ff).toFixed(2)+'</strong><br><span>Curso adecuado='+(formData.ff_curso?'Sí':'No')+' · Cobertura='+Number(formData.ff_cobertura||0).toFixed(1)+'% · Menos de 2 años='+(formData.ff_antiguedad?'Sí':'No')+' · Eficacia='+(formData.ff_eficacia?'Sí':'No')+' · Información/adiestramiento='+(formData.ff_informacion?'Sí':'No')+'</span>';
    }catch(e){if(out){out.hidden=false;out.innerHTML='<span class="error">No se puede calcular todavía: '+e.message+'</span>';}}
  }
  function bind(){
    if(!isFF())return;
    document.querySelectorAll('#formContainer input[type="radio"]').forEach(r=>{
      if(r.dataset.ffFix==='1')return;
      r.dataset.ffFix='1';
      r.addEventListener('change',sync,false);
    });
    document.querySelectorAll('#formContainer input[type="number"]').forEach(r=>{
      if(r.dataset.ffFix==='1')return;
      r.dataset.ffFix='1';
      r.addEventListener('input',sync,false);
      r.addEventListener('change',sync,false);
    });
    document.querySelectorAll('#formContainer [data-help="ff"]').forEach(b=>{
      if(b.dataset.ffButtonFix==='1')return;
      b.dataset.ffButtonFix='1';
      b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();help(b);},true);
    });
    document.querySelectorAll('#formContainer [data-partial-factor="ff"]').forEach(b=>{
      if(b.dataset.ffButtonFix==='1')return;
      b.dataset.ffButtonFix='1';
      b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();partial();},true);
    });
    sync();
  }
  function watch(){
    const fc=$('formContainer');
    if(!fc)return;
    new MutationObserver(bind).observe(fc,{childList:true,subtree:true});
    bind();
  }
  document.addEventListener('DOMContentLoaded',watch);
})();
