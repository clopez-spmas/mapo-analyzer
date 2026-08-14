/* MAPO runtime compatibility fixes. No modifica OCRA ni fórmulas MAPO. */
(function(){
  function syncNavigation(){
    try{
      const study=window.MAPO_STUDIES?.[window.selectedStudy];
      const stepCount=study?.steps?.length;
      if(!Number.isFinite(stepCount)) return;
      const step=Number(window.currentStep)||0;
      const prev=document.getElementById('previousStep'),next=document.getElementById('nextStep'),calc=document.getElementById('calculate');
      if(prev) prev.hidden=step<=0;
      if(next) next.hidden=step>=stepCount-1;
      if(calc) calc.hidden=step!==stepCount-1;
    }catch(e){}
  }
  function installNavigation(){
    if(typeof window.renderStep==='function'&&!window.renderStep.__mapoRuntimeWrapped){
      const original=window.renderStep;
      const wrapped=function(){const r=original.apply(this,arguments);setTimeout(syncNavigation,0);return r;};
      wrapped.__mapoRuntimeWrapped=true;window.renderStep=wrapped;
    }
    syncNavigation();
  }
  function fallbackSimulation(){
    const host=document.getElementById('mapoSimulation');
    if(!host){alert('No se ha encontrado la pantalla de simulación.');return;}
    if(window.selectedStudy!=='hospitalizacion'){alert('La simulación está disponible actualmente para Salas de hospitalización.');return;}
    let f;try{f=window.calculateHospitalizacionFactors(window.formData||{});}catch(e){host.innerHTML='<div class="error">No se ha podido iniciar la simulación: '+String(e.message||e)+'</div>';host.hidden=false;return;}
    const mapo=window.lastResult?.mapo;
    const rows=[['FS',f.fs],['FA',f.fa],['FC',f.fc],['Famb',f.famb],['FF',f.ff]].filter(x=>Number.isFinite(Number(x[1])));
    host.innerHTML='<div class="section-heading"><div><h2>Simulación de mejora del índice MAPO</h2><p>Escenario independiente. El estudio original no se modifica.</p></div><button type="button" id="closeRuntimeSimulation" class="secondary">Cerrar simulación</button></div><div class="simulation-summary"><strong>MAPO actual:</strong> '+(mapo==null?'—':Number(mapo).toFixed(2))+'<p>Factores actuales:</p><table><thead><tr><th>Factor</th><th>Valor actual</th></tr></thead><tbody>'+rows.map(x=>'<tr><td><strong>'+x[0]+'</strong></td><td>'+Number(x[1]).toFixed(2)+'</td></tr>').join('')+'</tbody></table></div><p>El simulador avanzado no se ha cargado; esta vista de seguridad confirma el acceso sin modificar los datos reales.</p>';
    host.hidden=false;document.getElementById('closeRuntimeSimulation').onclick=()=>host.hidden=true;host.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function bindSimulation(){
    const b=document.getElementById('openMapoSimulation');if(!b||b.__mapoRuntimeBound)return;
    b.__mapoRuntimeBound=true;b.removeAttribute('onclick');
    b.addEventListener('click',function(e){e.preventDefault();try{if(window.MAPOSimulation&&typeof window.MAPOSimulation.open==='function')window.MAPOSimulation.open();else fallbackSimulation();}catch(err){console.error(err);fallbackSimulation();}});
  }
  function init(){installNavigation();bindSimulation();const observer=new MutationObserver(()=>{installNavigation();bindSimulation();});observer.observe(document.body,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
