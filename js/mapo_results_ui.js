/* UI de resultados MAPO. No modifica el cálculo. */
(function(){
  const $=id=>document.getElementById(id), n=v=>Number(v||0), pct=v=>Number(v||0).toFixed(1)+'%';
  function render(){
    const r=$('result'); if(!r||r.hidden||!lastResult)return;
    const t=lastResult.taskTotals||{};
    $('breakdown').innerHTML=`<div class="mapo-result-table">
      <div class="mapo-result-row mapo-result-main"><div><strong>MAPO</strong></div><div><strong>${n(lastResult.mapo).toFixed(2)}</strong></div></div>
      <div class="mapo-result-row"><div>Nivel de exposición</div><div><strong>${lastResult.nivel||''}</strong></div></div>
      <div class="mapo-result-row"><div><strong>OP</strong></div><div>${n(formData.op).toFixed(3)}</div></div>
      <div class="mapo-result-row"><div><strong>ST</strong></div><div>${n(t.st)} &nbsp;·&nbsp; <strong>LTA</strong> ${n(t.lta)} &nbsp;·&nbsp; <strong>SP</strong> ${n(t.sp)} &nbsp;·&nbsp; <strong>LPA</strong> ${n(t.lpa)}</div></div>
      <div class="mapo-result-row"><div><strong>%LTA</strong></div><div>${pct(t.pLTA)}</div></div>
      <div class="mapo-result-row"><div><strong>%LPA</strong></div><div>${pct(t.pLPA)}</div></div>
      <div class="mapo-result-row mapo-factors"><div><strong>Factores MAPO</strong></div><div><strong>FS</strong> ${n(lastResult.fs).toFixed(2)} &nbsp;·&nbsp; <strong>FA</strong> ${n(lastResult.fa).toFixed(2)} &nbsp;·&nbsp; <strong>FC</strong> ${n(lastResult.fc).toFixed(2)} &nbsp;·&nbsp; <strong>Famb</strong> ${n(lastResult.famb).toFixed(2)} &nbsp;·&nbsp; <strong>FF</strong> ${n(lastResult.ff).toFixed(2)}</div></div>
    </div>`;
    const heading=r.querySelector('.section-heading');
    if(heading&&!$('openMapoSimulation')){
      const b=document.createElement('button');b.id='openMapoSimulation';b.type='button';b.className='secondary';b.textContent='Simular mejoras del índice MAPO';
      b.onclick=()=>{try{if(window.MAPOSimulation?.open)window.MAPOSimulation.open();else throw Error('No se ha cargado el módulo de simulación.');}catch(e){alert('No se pudo abrir la simulación: '+e.message);}};heading.appendChild(b);
    }
  }
  function watch(){
    const r=$('result'); if(!r)return;
    /* Solo observamos el cambio de visibilidad. Observar el contenido generado por render()
       provocaba una recursión infinita y podía dejar inactivos los botones. */
    new MutationObserver(()=>{if(!r.hidden&&lastResult)render();}).observe(r,{attributes:true,attributeFilter:['hidden']});
  }
  document.addEventListener('DOMContentLoaded',watch);
  window.MAPOResultsUI={render};
})();
