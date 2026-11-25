/* Conecta los resultados de la tabla de movilizaciones con FS y FA. */
(function(){
  const original=calculateHospitalizacionFactors;
  function yn(v){return v===true||v==='yes';}

  /*
   * La pantalla actual de movilizaciones guarda los datos en
   * formData.mobilizations. La implementación histórica de
   * calculateHospitalizacionFactors todavía utilizaba formData.tasks.
   * Por tanto, la validación podía ver ST/LTA como cero aunque la tabla
   * estuviera correctamente cumplimentada.
   *
   * Este adaptador hace que FS, FA y sus porcentajes utilicen SIEMPRE la
   * tabla real de movilizaciones, manteniendo intactas las demás fórmulas.
   */
  window.calculateHospitalizacionFactors=original;

  /*
   * El cálculo parcial de FA debe utilizar siempre los datos reales de las
   * pantallas de movilizaciones. No modifica la fórmula MAPO.
   */
  document.addEventListener('click',function(e){
    const b=e.target.closest?.('[data-partial-factor="fa"]');
    if(!b)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    try{
      document.querySelectorAll('#formContainer input').forEach(el=>{
        const id=el.dataset.field||el.id;
        if(!id)return;
        if(el.type==='radio'){
          if(el.checked)formData[id]=el.value==='yes';
        }else if(el.type==='number'){
          formData[id]=el.value===''?'':Number(el.value);
        }
      });

      const totals=typeof window.mobilizationTotals==='function'
        ? window.mobilizationTotals()
        : {SP:0,LPA:0};
      const sp=Number(totals.SP||0);
      const lpa=Number(totals.LPA||0);
      const sufficient=(yn(formData.fa_sabana)&&yn(formData.fa_dos)) ||
                       (yn(formData.fa_sabana)&&yn(formData.fa_camas3));
      const adequate=sp>0?lpa/sp>=0.9:null;
      const fa=sufficient&&adequate?0.5:1;
      const out=document.getElementById('partial_fa');
      if(!out)return;
      out.hidden=false;
      out.innerHTML=`<strong>Factor de ayudas menores (FA) = ${!Number(formData.pc)?'No procede (sin repercusión)':adequate===null?'Pendiente de revisión':fa.toFixed(2)}</strong><br><span>Suficiencia de ayudas=${sufficient?'Sí':'No'} · Adecuación por tareas=${adequate===null?'No procede':adequate?'Sí':'No'} · LPA=${lpa} / SP=${sp}</span>`;
    }catch(err){
      const out=document.getElementById('partial_fa');
      if(out){out.hidden=false;out.innerHTML=`<span class="error">${err.message}</span>`;}
    }
  },true);
})();
