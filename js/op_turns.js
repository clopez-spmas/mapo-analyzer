/* MAPO — OP calculado por el módulo de horarios. No muestra resultados parciales por turno. */
(function(){
  'use strict';
  function sync(){
    const op=Number(window.formData?.op);
    const box=document.getElementById('workerV3Results');
    if(!box)return;
    box.innerHTML='<p><strong>OP: '+(Number.isFinite(op)?op:0).toFixed(3)+'</strong></p>';
  }
  function start(){
    const root=document.getElementById('formContainer');
    if(!root)return;
    const mo=new MutationObserver(()=>{clearTimeout(start.t);start.t=setTimeout(sync,0);});
    mo.observe(root,{childList:true,subtree:true});
    sync();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();