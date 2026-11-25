/* Validaciones previas al cálculo final de Hospitalización. */
(function(){
  const btn=document.getElementById('calculate');
  if(!btn)return;
  btn.addEventListener('click',function(e){
    if(selectedStudy!=='hospitalizacion')return;
    try{
      if(!window.getHospitalizacionPatientCounts)throw Error('No se ha cargado la clasificación de pacientes.');
      window.getHospitalizacionPatientCounts(formData);
      if(!(Number(formData.op)>0))throw Error('Complete primero Personas trabajadoras / turnos para obtener OP.');
      const f=window.calculateHospitalizacionFactors(formData);
      if(f.taskTotals.st===0&&Number(formData.nc)>0)throw Error('No hay levantamientos totales registrados, pero existen pacientes NC. Revise la situación.');
      if(f.taskTotals.sp===0&&Number(formData.pc)>0)throw Error('No hay levantamientos parciales registrados, pero existen pacientes PC. Revise la situación.');
      if(f.fc===null)throw Error('Complete el registro de sillas de ruedas para calcular PMSR y FC.');
      if(f.famb===null)throw Error('Complete baños para higiene, baños con WC y habitaciones para calcular PMB, PMWC y PMH.');
    }catch(err){e.preventDefault();e.stopImmediatePropagation();const box=document.getElementById('error');box.textContent=err.message;box.hidden=false;document.getElementById('result').hidden=true;}
  },true);
})();
