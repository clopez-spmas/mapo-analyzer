/* UI de resultados MAPO. Solo presentación; no modifica cálculos. */
(function(){
'use strict';
const $=id=>document.getElementById(id),n=v=>Number(v||0),pct=v=>Number(v||0).toFixed(1)+'%';
function getState(){return typeof window.MAPOReportState==='function'?window.MAPOReportState():null;}
function getResult(){const s=getState();return s&&s.result&&Object.keys(s.result).length?s.result:window.lastResult||null;}
const labels={
 OP:'Ocupación de personal equivalente durante la jornada evaluada',
 ST:'Número total de movilizaciones de pacientes realizadas',
 LTA:'Número de movilizaciones de pacientes no colaboradores',
 SP:'Número total de movilizaciones parciales evaluadas',
 LPA:'Número de movilizaciones parciales realizadas con ayuda',
 FS:'Factor de elevación',
 FA:'Factor de ayudas menores',
 FC:'Factor de sillas de ruedas',
 Famb:'Factor ambiental',
 FF:'Factor de formación'
};
function resultHtml(result,op){const t=result.taskTotals||{};const rows=[
['MAPO','Índice MAPO de exposición a la movilización manual de pacientes',n(result.mapo).toFixed(2)],
['Nivel de exposición','Nivel de exposición obtenido según el índice MAPO',result.nivel||''],
['OP',labels.OP,n(op).toFixed(3)],
['ST',labels.ST,n(t.st)],
['LTA',labels.LTA,n(t.lta)],
['SP',labels.SP,n(t.sp)],
['LPA',labels.LPA,n(t.lpa)],
['% LTA','Porcentaje de movilizaciones de pacientes no colaboradores respecto al total',pct(t.pLTA)],
['% LPA','Porcentaje de movilizaciones parciales realizadas con ayuda respecto al total',pct(t.pLPA)],
['FS',labels.FS,n(result.fs).toFixed(2)],
['FA',labels.FA,n(result.fa).toFixed(2)],
['FC',labels.FC,n(result.fc).toFixed(2)],
['Famb',labels.Famb,n(result.famb).toFixed(2)],
['FF',labels.FF,n(result.ff).toFixed(2)]];
return '<table class="mapo-report-table mapo-result-table"><thead><tr><th>Indicador</th><th>Descripción</th><th>Valor</th></tr></thead><tbody>'+rows.map(r=>'<tr><th>'+r[0]+'</th><td>'+r[1]+'</td><td>'+r[2]+'</td></tr>').join('')+'</tbody></table>';}
function copyResult(button){const table=$('breakdown')?.querySelector('.mapo-result-table');if(!table)return;const clone=table.cloneNode(true);clone.style.cssText='width:100%;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt';clone.querySelectorAll('th,td').forEach(c=>{c.style.border='1px solid #b7b7b7';c.style.padding='8px';c.style.verticalAlign='middle';});const html='<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>'+clone.outerHTML+'</body></html>',text=table.innerText;try{if(navigator.clipboard&&window.ClipboardItem)navigator.clipboard.write([new ClipboardItem({'text/html':new Blob([html],{type:'text/html'}),'text/plain':new Blob([text],{type:'text/plain'})})]);else{const h=document.createElement('div');h.contentEditable='true';h.style.position='fixed';h.style.left='-9999px';h.innerHTML=html;document.body.appendChild(h);const range=document.createRange();range.selectNodeContents(h);const sel=window.getSelection();sel.removeAllRanges();sel.addRange(range);document.execCommand('copy');sel.removeAllRanges();h.remove();}button.textContent='✓ Tabla copiada';setTimeout(()=>button.textContent='Copiar tabla para Word',1800);}catch(e){button.textContent='No se pudo copiar';setTimeout(()=>button.textContent='Copiar tabla para Word',1800);}}
function render(){const r=$('result'),result=getResult();if(!r||!result)return;const breakdown=$('breakdown');if(!breakdown)return;const state=getState();const form=state?.form||(window.formData||{});$('mapoValue').textContent=`MAPO = ${n(result.mapo).toFixed(2)}`;$('classification').textContent=`Nivel de exposición: ${result.nivel||''}`;breakdown.innerHTML=resultHtml(result,form?.op)+'<div class="report-table-actions" style="margin-top:10px"><button type="button" id="copyMapoResultTable">Copiar tabla para Word</button></div>';const b=$('copyMapoResultTable');if(b)b.onclick=()=>copyResult(b);}
function watch(){const r=$('result');if(!r)return;const obs=new MutationObserver(()=>{if(!r.hidden&&getResult())render();});obs.observe(r,{attributes:true,attributeFilter:['hidden']});if(!r.hidden&&getResult())render();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch);else watch();window.MAPOResultsUI={render};
})();