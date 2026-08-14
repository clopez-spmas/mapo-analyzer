/* Acceso a Cargar estudio desde la pantalla inicial. */
(function(){
  function init(){
    const host=document.getElementById('studySelection');
    if(!host||document.getElementById('loadStudyStart'))return;
    const row=document.createElement('div');
    row.id='loadStudyStart';
    row.style.marginTop='16px';
    row.innerHTML='<button type="button" class="secondary" id="loadStudyStartButton">Cargar estudio guardado</button><input id="loadStudyStartFile" type="file" accept=".json,.mapo.json,application/json" hidden>';
    host.appendChild(row);
    document.getElementById('loadStudyStartButton').onclick=()=>document.getElementById('loadStudyStartFile').click();
    document.getElementById('loadStudyStartFile').onchange=e=>{const f=e.target.files?.[0];if(f&&window.MAPOStudyIO)window.MAPOStudyIO.loadStudyFile(f);e.target.value='';};
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
