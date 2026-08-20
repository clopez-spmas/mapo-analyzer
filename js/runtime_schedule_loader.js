/* MAPO runtime loader: descubre automáticamente el motor de horarios más reciente. */
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
 s.onload=()=>{window.mapoScheduleRuntimeLoaded=true;window.mapoScheduleRuntimeVersion=name;};
 s.onerror=e=>console.error('No se pudo cargar el motor MAPO de horarios:',name,e);
 document.head.appendChild(s);
}
function discover(){
 const xhr=new XMLHttpRequest();
 xhr.open('GET',API,true);
 xhr.setRequestHeader('Accept','application/vnd.github+json');
 xhr.onload=()=>{
  try{
   if(xhr.status>=200&&xhr.status<300){load(pickLatest(JSON.parse(xhr.responseText)));return;}
  }catch(e){console.warn('No se pudo determinar automáticamente la versión del motor MAPO.',e);}
  load(FALLBACK);
 };
 xhr.onerror=()=>load(FALLBACK);
 xhr.send();
}
discover();
})();
