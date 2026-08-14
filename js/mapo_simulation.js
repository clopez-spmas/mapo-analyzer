/* MAPO Analyzer — simulación de mejoras.
   Módulo independiente. No modifica OCRA ni las fórmulas MAPO existentes.
*/
(function(){
  'use strict';
  var baseData=null, simulationData=null;
  var BEST={fs:0.5,fa:0.5,fc:0.75,famb:0.75,ff:0.75};
  var LABEL={fs:'FS — Elevación',fa:'FA — Ayudas menores',fc:'FC — Sillas de ruedas',famb:'Famb — Ambiente',ff:'FF — Formación'};
  function el(id){return document.getElementById(id);}
  function clone(v){try{return JSON.parse(JSON.stringify(v||{}));}catch(e){return {};}}
  function factors(data){
    try{if(typeof window.calculateHospitalizacionFactors==='function')return window.calculateHospitalizacionFactors(data)||{};}catch(e){console.error(e);}
    return {fs:Number(data&&data.fs)||0,fa:Number(data&&data.fa)||0,fc:Number(data&&data.fc)||0,famb:Number(data&&data.famb)||0,ff:Number(data&&data.ff)||0};
  }
  function mapo(data,f){
    var op=Number(data&&data.op)||0,nc=Number(data&&data.nc)||0,pc=Number(data&&data.pc)||0;
    if(!op)return null;
    return ((nc/op*(Number(f.fs)||0))+(pc/op*(Number(f.fa)||0)))*(Number(f.fc)||0)*(Number(f.famb)||0)*(Number(f.ff)||0);
  }
  function render(){
    var host=el('mapoSimulation');
    if(!host)throw new Error('No existe la pantalla de simulación.');
    var f=factors(simulationData), original=factors(baseData), originalMapo=mapo(baseData,original), keys=['fs','fa','fc','famb','ff'];
    var html='<div class="section-heading"><div><h2>Simulación de mejora del índice MAPO</h2><p>Se trabaja sobre una copia del estudio. Los datos originales no se modifican.</p></div><button type="button" id="closeMapoSimulation" class="secondary">Cerrar simulación</button></div>';
    html+='<div class="simulation-summary"><strong>MAPO actual:</strong> '+(originalMapo==null?'—':originalMapo.toFixed(2))+' &nbsp;→&nbsp; <strong>MAPO simulado:</strong> <span class="sim-score">'+(mapo(simulationData,f)==null?'—':mapo(simulationData,f).toFixed(2))+'</span></div>';
    html+='<p>Los factores que no están en su mejor valor aparecen abajo. Puede modificar el valor de simulación y recalcular.</p>';
    keys.forEach(function(k){
      var v=Number(f[k])||0;
      if(v>BEST[k])html+='<div class="simulation-factor"><div class="simulation-factor-head"><h3>'+LABEL[k]+'</h3><span>Actual: <b>'+v.toFixed(2)+'</b> · Mejor: <b>'+BEST[k].toFixed(2)+'</b></span></div><label>Valor simulado <input type="number" min="0" step="0.01" data-sim-factor="'+k+'" value="'+v.toFixed(2)+'"></label></div>';
    });
    html+='<div class="actions"><button type="button" id="recalcMapoSimulation">Recalcular simulación</button><button type="button" id="resetMapoSimulation" class="secondary">Restablecer</button></div>';
    host.innerHTML=html;host.hidden=false;
    el('closeMapoSimulation').onclick=close;
    el('recalcMapoSimulation').onclick=function(){host.querySelectorAll('[data-sim-factor]').forEach(function(i){simulationData[i.getAttribute('data-sim-factor')]=Number(i.value);});render();};
    el('resetMapoSimulation').onclick=function(){simulationData=clone(baseData);render();};
    host.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function open(){
    try{
      if(typeof formData==='undefined')throw new Error('No hay datos del estudio disponibles.');
      baseData=clone(formData);simulationData=clone(formData);render();
    }catch(e){
      var host=el('mapoSimulation');
      if(host){host.hidden=false;host.innerHTML='<div class="error"><strong>No se ha podido abrir la simulación.</strong><br>'+String(e.message||e)+'</div>';host.scrollIntoView({behavior:'smooth',block:'start'});}
      console.error('MAPO simulación:',e);
    }
  }
  function close(){var host=el('mapoSimulation');if(host)host.hidden=true;}
  window.MAPOSimulation={open:open,close:close};
  window.openMapoSimulation=open;
  function bind(){var b=el('openMapoSimulation');if(b)b.onclick=function(e){e.preventDefault();open();};}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();
