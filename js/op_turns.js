/* MAPO — presentación de OP por turno. No recalcula OP. */
(function(){
  function paint(){
    const box=document.getElementById('workerV3Results');
    if(!box)return;
    const op=window.formData?.opByShift;
    if(!op)return;
    const table=box.querySelector('table');
    if(!table)return;
    const th=table.querySelector('thead tr');
    if(!th)return;
    if(!th.querySelector('[data-op-turn]')){
      const h=document.createElement('th');
      h.dataset.opTurn='1';
      h.textContent='OP';
      th.appendChild(h);
    }
    const keys=['morning','afternoon','night'];
    table.querySelectorAll('tbody tr').forEach((tr,i)=>{
      if(i>2)return;
      let td=tr.querySelector('[data-op-turn]');
      if(!td){td=document.createElement('td');td.dataset.opTurn='1';tr.appendChild(td);}
      td.textContent=Number(op[keys[i]]||0).toFixed(3);
    });
    let foot=box.querySelector('[data-op-global]');
    if(!foot){foot=document.createElement('p');foot.dataset.opGlobal='1';table.parentElement.appendChild(foot);}
    const global=keys.reduce((sum,k)=>sum+Number(op[k]||0),0);
    foot.innerHTML='<strong>OP por turnos — global:</strong> '+global.toFixed(3);
  }
  function start(){
    const root=document.getElementById('formContainer');
    if(!root)return;
    const mo=new MutationObserver(()=>{clearTimeout(start.t);start.t=setTimeout(paint,0);});
    mo.observe(root,{childList:true,subtree:true});
    paint();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();