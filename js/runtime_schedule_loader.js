/* MAPO runtime loader: descubre y carga la cadena completa del motor de horarios.
 * Los workers_schedule_vN.js son evoluciones acumulativas: v4 proporciona la UI/base
 * y las versiones posteriores aplican correcciones sobre ella. Por eso NO basta con
 * cargar únicamente la versión numéricamente más alta.
 *
 * Este archivo se carga desde index.html antes de los módulos dependientes y usa
 * document.write para conservar el orden de ejecución durante el parseo.
 */
(function(){
'use strict';
const API='https://api.github.com/repos/clopez-spmas/mapo-analyzer/contents/js?ref=main';
const FALLBACK=['workers_schedule_v4.js','workers_schedule_v5.js'];
function versions(items){
 const files=(items||[]).map(x=>x&&x.name).filter(n=>/^workers_schedule_v\d+\.js$/.test(n));
 files.sort((a,b)=>Number(a.match(/v(\d+)\.js$/)[1])-Number(b.match(/v(\d+)\.js$/)[1]));
 return files;
}
function inject(names){
 names.forEach(name=>{
  const src='js/'+name+'?runtime='+Date.now();
  window.mapoScheduleRuntimeVersion=name;
  document.write('<script src="'+src.replace(/"/g,'&quot;')+'"><\\/script>');
 });
 window.mapoScheduleRuntimeLoaded=true;
 window.mapoScheduleRuntimeVersions=names.slice();
}
function discover(){
 const xhr=new XMLHttpRequest();
 try{
  xhr.open('GET',API,false);
  xhr.setRequestHeader('Accept','application/vnd.github+json');
  xhr.send();
  if(xhr.status>=200&&xhr.status<300){
   try{
    const found=versions(JSON.parse(xhr.responseText));
    if(found.length){inject(found);return;}
   }catch(e){console.warn('No se pudo determinar automáticamente la cadena del motor MAPO.',e);}
  }
 }catch(e){console.warn('No se pudo consultar GitHub para determinar el motor MAPO.',e);}
 inject(FALLBACK);
}
discover();
})();
