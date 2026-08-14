/* MAPO Analyzer — simulación de mejoras.
   IMPORTANTE: módulo independiente. No modifica OCRA ni las fórmulas MAPO existentes.
   La pantalla trabaja siempre sobre una copia de formData.
*/
(function(){
  'use strict';

  var baseData = null;
  var simulationData = null;
  var BEST = { fs:0.5, fa:0.5, fc:0.75, famb:0.75, ff:0.75 };
  var LABEL = { fs:'FS — Elevación', fa:'FA — Ayudas menores', fc:'FC — Sillas de ruedas', famb:'Famb — Ambiente', ff:'FF — Formación' };

  function clone(value){
    try { return JSON.parse(JSON.stringify(value || {})); }
    catch(e){ return {}; }
  }

  function get(id){ return document.getElementById(id); }

  function getFactors(data){
    try {
      if(typeof window.calculateHospitalizacionFactors === 'function'){
        return window.calculateHospitalizacionFactors(data) || {};
      }
    } catch(e){ console.error('MAPO simulación: cálculo de factores', e); }
    return {
      fs:Number(data && data.fs) || 0,
      fa:Number(data && data.fa) || 0,
      fc:Number(data && data.fc) || 0,
      famb:Number(data && data.famb) || 0,
      ff:Number(data && data.ff) || 0
    };
  }

  function getMapo(data, factors){
    var op=Number(data && data.op) || 0;
    var nc=Number(data && data.nc) || 0;
    var pc=Number(data && data.pc) || 0;
    if(!op) return null;
    return ((nc/op*Number(factors.fs||0))+(pc/op*Number(factors.fa||0))) * Number(factors.fc||0) * Number(factors.famb||0) * Number(factors.ff||0);
  }

  function factorCard(key,value){
    var best=BEST[key];
    var current=Number(value);
    var improved=current>best;
    return '<div class="simulation-factor">'+
      '<div class="simulation-factor-head"><h3>'+LABEL[key]+'</h3><span>Actual: <b>'+current.toFixed(2)+'</b> · Mejor: <b>'+best.toFixed(2)+'</b></span></div>'+
      '<p>'+ (improved ? 'Este factor no está en su mejor valor. Puede estudiarse una mejora.' : 'Este factor ya está en su mejor valor.') +'</p>'+
      '<label>Valor simulado <input type="number" step="0.01" min="0" value="'+current.toFixed(2)+'" data-sim-factor="'+key+'"></label>'+
      '</div>';
  }

  function calculateSimulation(){
    var factors=getFactors(simulationData);
    var inputs=document.querySelectorAll('#mapoSimulation [data-sim-factor]');
    inputs.forEach(function(input){
      var key=input.getAttribute('data-sim-factor');
      var value=Number(input.value);
      if(isFinite(value)) factors[key]=value;
    });
    return { factors:factors, mapo:getMapo(simulationData,factors) };
  }

  function render(){
    var host=get('mapoSimulation');
    if(!host) throw new Error('No existe la pantalla de simulación.');

    var factors=getFactors(simulationData);
    var result=calculateSimulation();
    var currentMapo=getMapo(baseData,getFactors(baseData));
    var keys=['fs','fa','fc','famb','ff'];
    var html='<div class="section-heading"><div><h2>Simulación de mejora del índice MAPO</h2><p>La simulación se realiza sobre una copia. El estudio original no se modifica.</p></div><button type="button" id="closeMapoSimulation" class="secondary">Cerrar simulación</button></div>';
    html+='<div class="simulation-summary"><strong>MAPO actual:</strong> '+(currentMapo==null?'—':currentMapo.toFixed(2))+' &nbsp;→&nbsp; <strong>MAPO simulado:</strong> <span class="sim-score">'+(result.mapo==null?'—':result.mapo.toFixed(2))+'</span></div>';
    html+='<p>Modifique los valores de los factores para comprobar el efecto de una posible mejora. El estudio original permanece intacto.</p>';
    keys.forEach(function(key){ if(Number(factors[key])>BEST[key]) html+=factorCard(key,factors[key]); });
    html+='<div class="actions"><button type="button" id="recalcMapoSimulation">Recalcular simulación</button><button type="button" id="resetMapoSimulation" class="secondary">Restablecer</button></div>';
    host.innerHTML=html;
    host.hidden=false;

    get('closeMapoSimulation').onclick=close;
    get('recalcMapoSimulation').onclick=function(){
      var inputs=host.querySelectorAll('[data-sim-factor]');
      inputs.forEach(function(input){ var key=input.getAttribute('data-sim-factor'); simulationData[key]=Number(input.value); });
      render();
    };
    get('resetMapoSimulation').onclick=function(){ simulationData=clone(baseData); render(); };
    host.querySelectorAll('[data-sim-factor]').forEach(function(input){
      input.addEventListener('input',function(){
        var factors=getFactors(simulationData);
        var mapo=getMapo(simulationData,factors);
        var score=host.querySelector('.sim-score');
        if(score && mapo!=null) score.textContent=mapo.toFixed(2);
      });
    });
    host.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function open(){
    var host=get('mapoSimulation');
    try{
      if(typeof formData === 'undefined') throw new Error('No hay datos del estudio disponibles.');
      baseData=clone(formData);
      simulationData=clone(formData);
      render();
    }catch(error){
      console.error('MAPO simulación:',error);
      if(host){ host.hidden=false; host.innerHTML='<div class="error"><strong>No se ha podido abrir la simulación.</strong><br>'+String(error.message||error)+'</div>'; host.scrollIntoView({behavior:'smooth',block:'start'}); }
    }
  }

  function close(){ var host=get('mapoSimulation'); if(host) host.hidden=true; }

  window.MAPOSimulation={open:open,close:close};
})();
