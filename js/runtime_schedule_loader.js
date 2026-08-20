/* MAPO runtime loader: descubre automáticamente el motor de horarios más reciente.
 * IMPORTANTE: este archivo se carga desde index.html antes de los módulos que
 * dependen del motor. Por eso la inyección del motor usa document.write para
 * mantener el orden de ejecución durante el parseo de la página.
 */
(function(){
'use strict';
const API='https://api.github.com/repos/clopez-spmas/mapo-analyzer/contents/js?ref=main';
const FALLBACK='workers_schedule_v5.js';
function pickLatest(items){
 const files=(items||[]).map(x=>x&&x.name).filter(n=>/^workers_schedule_v\d+\.js$/.test(n));
 if(!files.length)return FALLBACK;
 files.sort((a,b)=>Number(b.match(/v(\d+)\.js$/)[1])-Number(a.match(/v(\d+)\.js$/)[1]));
 return files[0];
}
function inject(name){
 const src='js/'+name+'?runtime='+Date.now();
 window.mapoScheduleRuntimeVersion=name;
 // El loader es un script clásico y se ejecuta durante el parseo de index.html.
 // document.write inserta el motor en ese mismo punto y evita que los módulos
 // posteriores se ejecuten antes de que el motor esté disponible.
 document.write('<script src="'+src.replace(/"/g,'&quot;')+'"><\\/script>');
 window.mapoScheduleRuntimeLoaded=true;
}
function discover(){
 const xhr=new XMLHttpRequest();
 try{
  xhr.open('GET',API,false);
  xhr.setRequestHeader('Accept','application/vnd.github+json');
  xhr.send();
  if(xhr.status>=200&&xhr.status<300){
   try{inject(pickLatest(JSON.parse(xhr.responseText)));return;}
   catch(e){console.warn('No se pudo determinar automáticamente la versión del motor MAPO.',e);}
  }
 }catch(e){console.warn('No se pudo consultar GitHub para determinar el motor MAPO.',e);}
 inject(FALLBACK);
}
discover();
})();
