/* MAPO — cargador canónico del motor de horarios.
 *
 * IMPORTANTE: este archivo NO contiene números de versión del motor.
 * El motor de horarios es SIEMPRE js/workers_schedule.js de main.
 * Las futuras modificaciones se hacen en ese archivo; index.html y este
 * cargador no necesitan cambiar.
 */
(function(){
'use strict';
const SRC='https://raw.githubusercontent.com/clopez-spmas/mapo-analyzer/main/js/workers_schedule.js';
const bust='?runtime='+Date.now();
const s=document.createElement('script');
s.src=SRC+bust;
s.async=false;
s.onload=function(){window.mapoScheduleRuntimeLoaded=true;};
s.onerror=function(e){window.mapoScheduleRuntimeLoaded=false;window.mapoScheduleRuntimeError='No se pudo cargar el motor canónico de horarios.';console.error('[MAPO]',window.mapoScheduleRuntimeError,e);};
document.currentScript?.parentNode?.insertBefore(s,document.currentScript.nextSibling);
})();
