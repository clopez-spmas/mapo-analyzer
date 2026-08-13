/* Ayudas y navegación visual de las movilizaciones. */
(function(){
 const original=renderMobilizations;
 const screens=[['manualTotal',0,'Movilizaciones manuales con levantamiento total — Mañana'],['manualTotal',1,'Movilizaciones manuales con levantamiento total — Tarde'],['manualTotal',2,'Movilizaciones manuales con levantamiento total — Noche'],['manualPartial',0,'Movilizaciones manuales con levantamiento parcial — Mañana'],['manualPartial',1,'Movilizaciones manuales con levantamiento parcial — Tarde'],['manualPartial',2,'Movilizaciones manuales con levantamiento parcial — Noche'],['aidedTotal',0,'Movilizaciones con ayuda — levantamiento total — Mañana'],['aidedTotal',1,'Movilizaciones con ayuda — levantamiento total — Tarde'],['aidedTotal',2,'Movilizaciones con ayuda — levantamiento total — Noche'],['aidedPartial',0,'Movilizaciones con ayuda — levantamiento parcial — Mañana'],['aidedPartial',1,'Movilizaciones con ayuda — levantamiento parcial — Tarde'],['aidedPartial',2,'Movilizaciones con ayuda — levantamiento parcial — Noche']];
 const groupIndex={manualTotal:1,manualPartial:2,aidedTotal:3,aidedPartial:4};
 function getState(){if(!formData.mobilizations)formData.mobilizations=emptyMobilizationData();if(!Number.isInteger(formData.mobilizations.uiScreen))formData.mobilizations.uiScreen=0;return formData.mobilizations;}
 function decorate(){
  const table=document.querySelector('.mob-table');if(!table)return;const state=getState(),screen=Math.max(0,Math.min(11,state.uiScreen));state.uiScreen=screen;const [key,shift,title]=screens[screen];
  table.querySelectorAll('thead tr:first-child th').forEach((h,i)=>{h.style.display=i===0||i===groupIndex[key]?'':'none';});
  table.querySelectorAll('thead tr:nth-child(2) th').forEach((h,i)=>{h.style.display=i===shift?'':'none';});
  [...table.querySelectorAll('tbody tr')].forEach(row=>[...row.children].forEach((cell,i)=>{const keep=i===0||i===screen+1||row.classList.contains('mob-section')||(row.dataset.custom==='true'&&i===13);cell.style.display=keep?'':'none';}));
  const old=document.getElementById('mobScreenNav');if(old)old.remove();
  const nav=document.createElement('div');nav.id='mobScreenNav';nav.style.cssText='margin:0 0 18px;padding:18px;background:#f7fafc;border:1px solid #d8e0e8;border-radius:10px;';
  nav.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap"><div><strong style="display:block;color:#005a9c;font-size:1.1rem">Pantalla ${screen+1} de 12</strong><span style="display:block;margin-top:5px">${title}</span></div><div style="display:flex;gap:8px"><button type="button" class="secondary" id="mobScreenPrev" ${screen===0?'disabled':''}>Anterior</button><button type="button" id="mobScreenNext">${screen===11?'Finalizar':'Continuar'}</button></div></div><div style="display:grid;grid-template-columns:repeat(12,1fr);gap:5px;margin-top:15px">${screens.map((s,i)=>`<button type="button" data-mob-screen="${i}" title="${s[2]}" style="padding:6px 2px;font-size:.78rem;${i===screen?'font-weight:800;':''}">${i+1}</button>`).join('')}</div>`;
  table.parentNode.insertBefore(nav,table);
  const save=()=>{if(typeof captureMobilizations==='function')captureMobilizations();};
  nav.querySelectorAll('[data-mob-screen]').forEach(b=>b.onclick=()=>{save();getState().uiScreen=Number(b.dataset.mobScreen);renderMobilizations();});
  nav.querySelector('#mobScreenPrev').onclick=()=>{save();getState().uiScreen--;renderMobilizations();};
  nav.querySelector('#mobScreenNext').onclick=()=>{save();if(getState().uiScreen<11){getState().uiScreen++;renderMobilizations();}else updateMobilizationSummary();};
  const heads=table.querySelectorAll('thead tr:first-child th'),texts=['Manual — total','Manual — parcial','Con ayuda — total','Con ayuda — parcial'],helps=['Cuente aquí la frecuencia de la tarea cuando el paciente es levantado completamente y no se utiliza equipamiento de ayuda.','Cuente aquí la frecuencia de la tarea cuando el paciente solo necesita un levantamiento parcial y no se utiliza equipamiento de ayuda.','Cuente aquí la frecuencia de la tarea cuando el paciente es levantado completamente utilizando un equipo o ayuda técnica.','Cuente aquí la frecuencia de la tarea cuando el paciente es levantado completamente utilizando un equipo o ayuda técnica.'];
  const hi=groupIndex[key];if(heads[hi]){const h=heads[hi];h.textContent=texts[hi-1];const b=document.createElement('button');b.type='button';b.className='help-trigger';b.textContent='?';b.title='Ayuda';b.style.marginLeft='6px';b.onclick=()=>alert(helps[hi-1]);h.appendChild(b);}
 }
 window.renderMobilizations=function(){original();decorate();};
})();
