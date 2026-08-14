/* Corrección aislada del cálculo parcial de FS. No ejecuta PMH ni otros factores. */
(function(){
  function yn(v){return v===true||v==='yes';}
  function readFsInputs(){
    document.querySelectorAll('#formContainer input').forEach(el=>{
      const id=el.dataset.field||el.id;
      if(!id)return;
      if(el.type==='radio'){
        if(el.checked)formData[id]=el.value==='yes';
      }else if(el.type==='number'){
        formData[id]=el.value===''?'':Number(el.value);
      }
    });
  }
  function calculateFsPartial(){
    readFsInputs();
    const totals=typeof window.mobilizationTotals==='function'
      ? window.mobilizationTotals()
      : {ST:0,LTA:0};
    const st=Number(totals.ST||0);
    const lta=Number(totals.LTA||0);
    const sufficient=Number(formData.nc||0)===0 || yn(formData.fs_elevadores) || yn(formData.fs_camillas) || yn(formData.fs_camas3);
    const adequate=st>0 && lta/st>=0.9;
    const fs=sufficient&&adequate?0.5:(!sufficient&&!adequate?4:2);
    const out=document.getElementById('partial_fs');
    if(!out)return;
    out.hidden=false;
    out.innerHTML=`<strong>Factor de elevación (FS) = ${fs.toFixed(2)}</strong><br><span>Suficiencia de equipamiento=${sufficient?'Sí':'No'} · Adecuación por tareas=${adequate?'Sí':'No'} · LTA=${lta} / ST=${st}</span>`;
  }
  document.addEventListener('click',function(e){
    const b=e.target.closest?.('[data-partial-factor="fs"]');
    if(!b)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    try{calculateFsPartial();}
    catch(err){const out=document.getElementById('partial_fs');if(out){out.hidden=false;out.innerHTML=`<span class="error">${err.message}</span>`;}}
  },true);
})();
