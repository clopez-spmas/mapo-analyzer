/* MAPO runtime loader: siempre obtiene la versión actual del motor de horarios. */
(function(){
'use strict';
const src='js/workers_schedule_v5.js?runtime='+Date.now();
const s=document.createElement('script');s.src=src;s.async=false;s.onload=()=>window.mapoScheduleRuntimeLoaded=true;s.onerror=e=>console.error('No se pudo cargar el motor MAPO de horarios',e);document.head.appendChild(s);
})();
