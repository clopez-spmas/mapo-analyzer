/* Acceso directo a la selección de estudio. */
(function(){
 function showAccessScreen(){
  const selection=document.getElementById('studySelection');
  if(selection)selection.hidden=false;
  for(const id of ['roomSetup','moduleHub','studyPanel','result','globalResults','multiRoomResultsHub','planningPanel','wordReportPanel','mapoSimulation','templateAdmin']){
   const el=document.getElementById(id);if(el)el.hidden=true;
  }
 }
 window.MAPOAccess={enterProgram:showAccessScreen,showAccessScreen};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',showAccessScreen);else showAccessScreen();
})();
