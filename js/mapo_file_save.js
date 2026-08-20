/* MAPO Analyzer — servicio de guardado local. No modifica cálculos. */
(function(){
  'use strict';
  async function saveBlob(blob,name){
    if(typeof window.showSaveFilePicker!=='function')return false;
    const xlsx=/\.xlsx$/i.test(name);
    const handle=await window.showSaveFilePicker({suggestedName:name,types:[{description:xlsx?'Estudio MAPO en Excel':'Estudio MAPO en JSON',accept:xlsx?{'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':['.xlsx']}:{'application/json':['.json']}}]});
    const writable=await handle.createWritable();
    try{await writable.write(blob);await writable.close();}catch(e){try{await writable.abort();}catch(_){}throw e;}
    return true;
  }
  window.MAPOFileSave={saveBlob};
})();
