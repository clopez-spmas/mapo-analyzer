/* MAPO runtime loader: descubre automáticamente el motor de horarios más reciente.
 * Se ejecuta antes de los módulos que dependen del motor, por lo que la carga
 * del motor seleccionado debe finalizar antes de continuar con index.html.
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
function load(name){
 const src='js/'+name+'?runtime='+Date.now();
 const s=document.createElement('script');
 s.src=src;
 s.async=false;
 s.onload=function(){window.mapoScheduleRuntimeLoaded=true;window.mapoScheduleRuntimeVersion=name;};
 s.onerror=function(e){console.error('No se pudo cargar el motor MAPO de horarios:',name,e);};
 document.head.appendChild(s);
}
function discover(){
 const xhr=new XMLHttpRequest();
 try{
  // Este loader se encuentra antes de los módulos dependientes en index.html.
  // La consulta síncrona garantiza que el motor esté seleccionado y solicitado
  // antes de que el parser continúe con dichos módulos.
  xhr.open('GET',API,false);
  xhr.setRequestHeader('Accept','application/vnd.github+json');
  xhr.send();
  if(xhr.status>=200&&xhr.status<300){
   try{load(pickLatest(JSON.parse(xhr.responseText)));return;}
   catch(e){console.warn('No se pudo determinar automáticamente la versión del motor MAPO.',e);}
  }
 }catch(e){console.warn('No se pudo consultar GitHub para determinar el motor MAPO.',e);}
 load(FALLBACK);
}
discover();
})();
