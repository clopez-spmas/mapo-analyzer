/* Navegación por resumen para Hospitalización.
   Este módulo NO sustituye renderStep ni los controles de navegación.
   El controlador único de navegación es navigation_controller.js.
*/
(function(){
  /* Los accesos se obtienen de la definición vigente de pasos, sin índices antiguos. */
  const descriptions={
    'Identificación de la unidad':'Datos de empresa, centro, unidad y visita.',
    'Descripción — Factores organizativos':'Texto descriptivo para el informe.',
    'Descripción — Frecuencia':'Rutinas por turno para el informe.',
    'Descripción — Formación':'Información descriptiva de formación.',
    'Descripción — Equipos de ayuda disponibles':'Fotografías, equipos de ayuda y ayudas menores.',
    'Descripción — Instalaciones':'Descripción de baños, habitaciones e instalaciones.',
    'Personas trabajadoras que realizan MMP':'Turnos, horarios y cálculo de Op.',
    'Pacientes':'Pacientes NC, PC y NA.',
    'Tareas de movilización':'Movilizaciones por turno y tareas personalizadas.',
    'Factor de elevación (FS)':'Evaluación del factor FS.',
    'Factor de ayudas menores (FA)':'Evaluación del factor FA.',
    'Factor de sillas de ruedas (FC)':'Sillas de ruedas, PMSR y suficiencia.',
    'Factor ambiente — baños':'Baños para higiene y baños con WC, PMB y PMWC.',
    'Habitaciones — cálculo de PMH':'Habitaciones, PMH y camas regulables.',
    'Factor formación (FF)':'Evaluación del factor FF.'
  };
  function groupsForStudy(){
    const steps=MAPO_STUDIES?.[selectedStudy]?.steps||[];
    const out=[];
    steps.forEach((step,i)=>{
      if(step.title==='Factor ambiente — baños'){
        out.push({i,t:'Baños para higiene (PMB)',d:'Registro de baños para higiene y ayudas para la higiene.',bathKind:'bath'});
        out.push({i,t:'Baños con WC (PMWC)',d:'Registro de baños con WC y sus condiciones ergonómicas.',bathKind:'wc'});
      }else out.push({i,t:step.title,d:descriptions[step.title]||'Datos de evaluación MAPO.'});
    });
    return out;
  }
  function status(i){
    const step=MAPO_STUDIES?.[selectedStudy]?.steps?.[i];if(!step)return 'Pendiente';
    if(step.custom==='reportDescription')return formData.informeDescriptivo?.[step.reportKey]?'Completado':'Pendiente';
    if(step.custom==='reportEquipment')return (formData.informeDescriptivo?.equipos||[]).length?'En curso':'Pendiente';
    if(step.custom==='pmh')return (formData.roomTypes||[]).length?'En curso':'Pendiente';
    if(step.custom==='wheelchairs')return (formData.wheelchairTypes||[]).length?'En curso':'Pendiente';
    if(step.custom==='mobilizations')return Object.keys(formData.mobilizations?.entries||{}).length?'En curso':'Pendiente';
    if(step.shiftSchedule)return formData.workerSchedule?'En curso':'Pendiente';
    if(step.title==='Factor ambiente — baños')return (formData.bathTypes||[]).length||(formData.wcTypes||[]).length?'En curso':'Pendiente';
    if(step.questionGroup)return 'En curso';
    if(step.fields)return step.fields.some(([key])=>formData[key]!==undefined&&formData[key]!=='')?'En curso':'Pendiente';
    return 'Pendiente';
  }
  function openResultScreen(kind){
    const api=window.MAPOResultScreens;
    if(kind==='result')return api?.showResult?.();
    if(kind==='tables')return api?.showTables?.();
    if(kind==='simulation')return api?.showSimulation?.();
    if(kind==='planning')return window.MAPOPlanning?.open?.(false);
    if(kind==='word'){const ok=api?.showTables?.();if(ok){window.MAPOWordGenerator?.open?.();}return ok;}
    return false;
  }
  function renderDashboard(){
    const groups=groupsForStudy();
    const host=document.getElementById('formContainer');
    if(!host)return;
    host.innerHTML=`<div class="dashboard-intro"><h3>Resumen de la evaluación</h3><p>Esta pantalla permite acceder directamente a cada bloque. No es necesario completar los bloques en el orden mostrado; el programa conservará los datos introducidos.</p></div><div class="actions"><button type="button" id="startHospitalizacionIdentification">Comenzar por identificación de la unidad</button></div><div class="dashboard-grid">${groups.map(g=>`<button type="button" class="dashboard-card" data-dashboard-step="${g.i}" ${g.bathKind?`data-dashboard-bath="${g.bathKind}"`:``}><span class="dashboard-number">${g.i+1}</span><span><strong>${g.t}</strong><small>${g.d}</small><em>${status(g.i)}</em></span></button>`).join('')}<button type="button" class="dashboard-card dashboard-result-shortcut" data-result-screen="result"><span class="dashboard-number">✓</span><span><strong>Resultados MAPO</strong><small>Consultar el resultado de la evaluación y los factores MAPO.</small><em>Resultado</em></span></button><button type="button" class="dashboard-card dashboard-result-shortcut" data-result-screen="tables"><span class="dashboard-number">▤</span><span><strong>Tablas para informe Word</strong><small>Seleccionar y preparar las tablas para copiar al informe.</small><em>Informe</em></span></button><button type="button" class="dashboard-card dashboard-result-shortcut" data-result-screen="simulation"><span class="dashboard-number">↗</span><span><strong>Simulación MAPO</strong><small>Simular mejoras y comprobar su efecto sobre el índice MAPO.</small><em>Simulación</em></span></button><button type="button" class="dashboard-card dashboard-result-shortcut" data-result-screen="planning"><span class="dashboard-number">☑</span><span><strong>Planificación preventiva</strong><small>Registrar medidas y trasladar propuestas de simulación.</small><em>Planificación</em></span></button><button type="button" class="dashboard-card dashboard-result-shortcut" data-result-screen="word"><span class="dashboard-number">▣</span><span><strong>Generar informe Word</strong><small>Preparar el documento DOCX con los datos del estudio.</small><em>Informe Word</em></span></button></div>`;
    document.getElementById('previousStep').hidden=true;
    document.getElementById('nextStep').hidden=true;
    document.getElementById('calculate').hidden=true;
    document.getElementById('progressBar').style.width='0%';
    const openStep=i=>{
      const m=window.MAPOMultiRoom?.state;
      if(m?.rooms?.length&&m.rooms[m.active])m.rooms[m.active].currentStep=i;
      currentStep=i;
      window.renderStep();
      window.MAPONavigation?.bindStandard?.();
    };
    host.querySelector('#startHospitalizacionIdentification')?.addEventListener('click',()=>openStep(0));
    host.querySelectorAll('[data-dashboard-step]').forEach(b=>b.onclick=()=>{
      const kind=b.dataset.dashboardBath;
      if(kind)window.MAPOBathrooms?.selectKind?.(kind);
      openStep(Number(b.dataset.dashboardStep));
      if(kind)window.MAPOBathrooms?.selectKind?.(kind);
    });
    host.querySelectorAll('[data-result-screen]').forEach(b=>b.onclick=e=>{
      e.preventDefault();
      e.stopPropagation();
      openResultScreen(b.dataset.resultScreen);
    });
  }
  window.goToMapoStep=i=>{
    currentStep=Number(i)||0;
    window.renderStep();
    window.MAPONavigation?.bindStandard?.();
  };
  window.showHospitalizacionDashboard=()=>{
    renderDashboard();
  };
  window.renderHospitalizacionDashboard=renderDashboard;
})();