/* Pantalla de acceso inicial de MAPO Analyzer. Las instrucciones por modalidad se enlazan desde la selección de estudio. */
(function(){
  function $(id){return document.getElementById(id);}

  function showAccessScreen(){
    const access=$('accessScreen');
    const selection=$('studySelection');
    const panel=$('studyPanel');
    const result=$('result');
    const admin=$('templateAdmin');
    if(access)access.hidden=false;
    if(selection)selection.hidden=true;
    if(panel)panel.hidden=true;
    if(result)result.hidden=true;
    if(admin)admin.hidden=true;
  }

  function enterProgram(){
    const access=$('accessScreen');
    if(access)access.hidden=true;
    const selection=$('studySelection');
    if(selection)selection.hidden=false;
  }

  function init(){
    const enter=$('enterProgram');
    if(enter)enter.addEventListener('click',enterProgram);
    showAccessScreen();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.MAPOAccess={enterProgram,showAccessScreen};
})();
