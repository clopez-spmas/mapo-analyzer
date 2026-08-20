/* MAPO — cargador estable del motor de horarios.
 *
 * ARQUITECTURA:
 * - index.html solo conoce este cargador estable.
 * - El código ejecutable del motor NO se obtiene desde la copia potencialmente
 *   cacheada de GitHub Pages, sino directamente desde main de GitHub.
 * - Se descubren TODOS los workers_schedule_vN.js y se cargan en orden.
 * - Cada recurso lleva un identificador de ejecución para impedir que el
 *   navegador reutilice una copia antigua.
 *
 * CONSECUENCIA:
 * Crear/modificar workers_schedule_vN.js en main actualiza el motor que usa
 * la aplicación sin cambiar números de versión en index.html.
 */
(function(){
'use strict';

const REPO_API='https://api.github.com/repos/clopez-spmas/mapo-analyzer/contents/js';
const RAW_BASE='https://raw.githubusercontent.com/clopez-spmas/mapo-analyzer/main/js/';
const cacheBust=Date.now().toString();

function getVersions(){
  const xhr=new XMLHttpRequest();
  xhr.open('GET',REPO_API+'?ref=main&_='+cacheBust,false);
  xhr.setRequestHeader('Accept','application/vnd.github+json');
  xhr.setRequestHeader('Cache-Control','no-cache');
  xhr.send();
  if(xhr.status<200||xhr.status>=300) throw new Error('GitHub API HTTP '+xhr.status);
  const items=JSON.parse(xhr.responseText);
  return items
    .map(x=>x&&x.name)
    .filter(name=>/^workers_schedule_v\d+\.js$/.test(name))
    .sort((a,b)=>{
      const av=Number(a.match(/v(\d+)\.js$/)[1]);
      const bv=Number(b.match(/v(\d+)\.js$/)[1]);
      return av-bv;
    });
}

function injectAll(names){
  if(!names.length) throw new Error('No se encontró ningún motor workers_schedule_vN.js en main.');

  names.forEach(name=>{
    const src=RAW_BASE+encodeURIComponent(name)+'?runtime='+cacheBust;
    window.mapoScheduleRuntimeVersion=name;
    document.write('<script src="'+src.replace(/"/g,'&quot;')+'"><\\/script>');
  });

  window.mapoScheduleRuntimeLoaded=true;
  window.mapoScheduleRuntimeVersions=names.slice();
}

function fail(message,error){
  console.error('[MAPO] '+message,error||'');
  window.mapoScheduleRuntimeLoaded=false;
  window.mapoScheduleRuntimeError=message;
}

try{
  injectAll(getVersions());
}catch(error){
  fail('No se pudo obtener la versión actual del motor de horarios desde GitHub.',error);
}
})();
