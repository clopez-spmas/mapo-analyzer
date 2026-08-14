/* MAPO Analyzer — navegación libre, guardado/carga local y exportación compatible con Excel.
   No usa localStorage ni servidor: el usuario decide cuándo y dónde guardar el archivo. */
(function(){
  const VERSION='1.0';
  const $=id=>document.getElementById(id);

  function clearError(){
    const box=$('error');
    if(box){box.textContent='';box.hidden=true;}
  }

  function captureWorkerSchedule(){
    const s=formData.workerSchedule=formData.workerSchedule||{};
    s.mode=document.querySelector('input[name="workerModeV3"]:checked')?.value||s.mode||'auto';
    s.page=document.querySelector('[data-v3-page].active')?.dataset.v3Page||s.page||'full';
    s.full=Array.isArray(s.full)?s.full:[];
    s.partial=Array.isArray(s.partial)?s.partial:[];
    document.querySelectorAll('[data-v3-t]').forEach(e=>{
      const page=e.dataset.v3T, i=Number(e.dataset.v3I), field=e.dataset.v3F;
      const arr=page==='partial'?s.partial:s.full;
      arr[i]=arr[i]||{};
      arr[i][field]=e.value;
      if(field==='people'&&e.value!=='')arr[i][field]=Number(e.value);
      if(field==='reference'&&e.value!=='')arr[i][field]=Number(e.value);
    });
    document.querySelectorAll('[data-shift]').forEach(e=>{
      s.shifts=s.shifts||{};
      s.shifts[e.dataset.shift]=s.shifts[e.dataset.shift]||{};
      s.shifts[e.dataset.shift][e.dataset.f]=e.value;
    });
  }

  function captureCurrentStep(){
    if(!selectedStudy)return;
    const step=MAPO_STUDIES[selectedStudy].steps[currentStep];
    if(!step)return;
    if(step.shiftSchedule){captureWorkerSchedule();return;}
    if(step.custom==='mobilizations'){if(typeof readTasks==='function')readTasks();return;}
    if(step.questionGroup){
      HOSPITALIZACION_QUESTIONS[step.questionGroup].forEach(q=>{
        if(q.type==='yesno'){
          const checked=document.querySelector(`input[name="${q.id}"]:checked`);
          if(checked)formData[q.id]=checked.value==='yes'; else delete formData[q.id];
        }else{
          const input=$(`field_${q.id}`);
          if(input&&input.value.trim()!=='')formData[q.id]=Number(input.value);else delete formData[q.id];
        }
      });
      return;
    }
    (step.fields||[]).forEach(([id,label,type])=>{
      const input=$(`field_${id}`);
      if(!input)return;
      const raw=input.value.trim();
      if(raw==='')delete formData[id];
      else formData[id]=type==='number'?Number(raw):raw;
    });
  }

  function goStep(delta){
    try{
      captureCurrentStep();
      const total=MAPO_STUDIES[selectedStudy].steps.length;
      currentStep=Math.max(0,Math.min(total-1,currentStep+delta));
      clearError();
      if(typeof renderStep==='function')renderStep();
      clearError();
    }catch(e){
      // La navegación nunca debe quedar bloqueada por datos incompletos.
      clearError();
      if(typeof renderStep==='function')renderStep();
      clearError();
    }
  }

  function studySnapshot(){
    captureCurrentStep();
    return {
      format:'MAPO Analyzer Study',
      formatVersion:VERSION,
      savedAt:new Date().toISOString(),
      study:selectedStudy,
      currentStep,
      formData:JSON.parse(JSON.stringify(formData||{})),
      lastResult:lastResult?JSON.parse(JSON.stringify(lastResult)):null
    };
  }

  function downloadBlob(blob,name){
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  }

  function saveStudy(){
    try{
      const snapshot=studySnapshot();
      const json=JSON.stringify(snapshot,null,2);
      const base=(snapshot.formData?.empresa||'MAPO_estudio').toString().trim().replace(/[^\wáéíóúüñÁÉÍÓÚÜÑ-]+/g,'_').slice(0,60)||'MAPO_estudio';
      downloadBlob(new Blob([json],{type:'application/json;charset=utf-8'}),`${base}.mapo.json`);
      clearError();
    }catch(e){
      const box=$('error');if(box){box.textContent='No se pudo guardar el estudio: '+e.message;box.hidden=false;}
    }
  }

  function loadStudyFile(file){
    const reader=new FileReader();
    reader.onload=()=>{
      try{
        const data=JSON.parse(reader.result);
        if(!data||data.format!=='MAPO Analyzer Study'||!data.study||!MAPO_STUDIES[data.study])throw Error('El archivo no es un estudio MAPO válido.');
        selectedStudy=data.study;
        currentStep=Math.max(0,Math.min(MAPO_STUDIES[selectedStudy].steps.length-1,Number(data.currentStep)||0));
        formData=data.formData&&typeof data.formData==='object'?data.formData:{};
        lastResult=data.lastResult||null;
        $('studySelection').hidden=true;$('studyPanel').hidden=false;
        $('result').hidden=true;
        clearError();
        renderStep();
        clearError();
        if(lastResult&&typeof lastResult.mapo==='number')renderLoadedResult();
      }catch(e){
        const box=$('error');if(box){box.textContent='No se pudo cargar el estudio: '+e.message;box.hidden=false;}
      }
    };
    reader.onerror=()=>{const box=$('error');if(box){box.textContent='No se pudo leer el archivo del estudio.';box.hidden=false;}};
    reader.readAsText(file,'utf-8');
  }

  function renderLoadedResult(){
    if(!lastResult||typeof lastResult.mapo!=='number')return;
    const r=lastResult;
    $('mapoValue').textContent=`MAPO = ${Number(r.mapo).toFixed(2)}`;
    $('classification').textContent=`Nivel de exposición: ${r.nivel||''}`;
    const tt=r.taskTotals||{};
    $('breakdown').innerHTML=`<p><strong>OP:</strong> ${Number(formData.op||0).toFixed(3)}</p><p><strong>ST:</strong> ${tt.st??0} · <strong>LTA:</strong> ${tt.lta??0} · <strong>SP:</strong> ${tt.sp??0} · <strong>LPA:</strong> ${tt.lpa??0}</p><p><strong>FS:</strong> ${Number(r.fs||0).toFixed(2)} · <strong>FA:</strong> ${Number(r.fa||0).toFixed(2)} · <strong>FC:</strong> ${Number(r.fc||0).toFixed(2)} · <strong>Famb:</strong> ${Number(r.famb||0).toFixed(2)} · <strong>FF:</strong> ${Number(r.ff||0).toFixed(2)}</p>`;
    $('result').hidden=false;
  }

  function csvEscape(v){
    const s=String(v??'');return /[;"\n\r]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;
  }
  function flatten(obj,prefix='',out=[]){
    if(obj===null||obj===undefined){out.push([prefix,'']);return out;}
    if(typeof obj!=='object'){out.push([prefix,obj]);return out;}
    if(Array.isArray(obj)){obj.forEach((v,i)=>flatten(v,`${prefix}[${i}]`,out));return out;}
    Object.keys(obj).forEach(k=>flatten(obj[k],prefix?`${prefix}.${k}`:k,out));
    return out;
  }
  function exportExcel(){
    try{
      const snapshot=studySnapshot();
      const rows=[['MAPO Analyzer — datos del estudio / resultados'],['Guardado',snapshot.savedAt],['Estudio',snapshot.study],['Paso actual',snapshot.currentStep+1],[]];
      rows.push(['DATOS DEL ESTUDIO','VALOR']);
      flatten(snapshot.formData).forEach(r=>rows.push(r));
      if(snapshot.lastResult){
        rows.push([],['RESULTADO','VALOR']);
        flatten(snapshot.lastResult).forEach(r=>rows.push(r));
      }
      const csv='\uFEFF'+rows.map(r=>r.map(csvEscape).join(';')).join('\r\n');
      const base=(snapshot.formData?.empresa||'MAPO_resultados').toString().trim().replace(/[^\wáéíóúüñÁÉÍÓÚÜÑ-]+/g,'_').slice(0,60)||'MAPO_resultados';
      downloadBlob(new Blob([csv],{type:'text/csv;charset=utf-8'}),`${base}.csv`);
    }catch(e){const box=$('error');if(box){box.textContent='No se pudieron exportar los datos: '+e.message;box.hidden=false;}}
  }

  function addIOControls(){
    const heading=document.querySelector('#studyPanel .section-heading');
    if(!heading||document.getElementById('studyIO'))return;
    const wrap=document.createElement('div');wrap.id='studyIO';wrap.className='study-io-controls';
    wrap.innerHTML='<button type="button" id="saveStudy" class="secondary">Guardar estudio</button><button type="button" id="loadStudy" class="secondary">Cargar estudio</button><button type="button" id="exportExcel" class="secondary">Exportar a Excel (CSV)</button><input id="loadStudyFile" type="file" accept=".json,.mapo.json,application/json" hidden>';
    heading.appendChild(wrap);
    $('saveStudy').onclick=saveStudy;
    $('exportExcel').onclick=exportExcel;
    $('loadStudy').onclick=()=>$('loadStudyFile').click();
    $('loadStudyFile').onchange=e=>{const f=e.target.files?.[0];if(f)loadStudyFile(f);e.target.value='';};
  }

  function init(){
    addIOControls();
    const next=$('nextStep'),prev=$('previousStep');
    if(next)next.onclick=()=>goStep(1);
    if(prev)prev.onclick=()=>goStep(-1);
    const change=$('changeStudy');
    if(change){
      const old=change.onclick;
      change.onclick=()=>{clearError();if(typeof old==='function')old();addIOControls();clearError();};
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.MAPOStudyIO={saveStudy,loadStudyFile,exportExcel,captureCurrentStep};
})();
