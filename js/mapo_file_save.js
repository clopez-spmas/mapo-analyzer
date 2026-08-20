/* MAPO Analyzer — servicio de guardado local. No modifica cálculos. */
(function(){
  'use strict';
  const supported=n=>/\.mapo\.json$/i.test(n)||/\.xlsx$/i.test(n);
  async function saveBlob(blob,name){
    if(typeof window.showSaveFilePicker!=='function')return false;
    const xlsx=/\.xlsx$/i.test(name);
    const handle=await window.showSaveFilePicker({suggestedName:name,types:[{description:xlsx?'Estudio MAPO en Excel':'Estudio MAPO en JSON',accept:xlsx?{'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':['.xlsx']}:{'application/json':['.json']}}]});
    const writable=await handle.createWritable();
    try{await writable.write(blob);await writable.close();}catch(e){try{await writable.abort();}catch(_){}throw e;}
    return true;
  }
  const nativeClick=HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click=function(){
    const name=this.download||'';
    const href=this.href||'';
    if(!supported(name)||!href.startsWith('blob:'))return nativeClick.call(this);
    const anchor=this;
    if(anchor.dataset.mapoSaveBusy==='1')return;
    anchor.dataset.mapoSaveBusy='1';
    (async()=>{
      try{
        if(typeof window.showSaveFilePicker!=='function')return nativeClick.call(anchor);
        const response=await fetch(href);
        if(!response.ok)throw new Error('No se pudo preparar el archivo para guardarlo.');
        await saveBlob(await response.blob(),name);
      }catch(e){
        if(e?.name==='AbortError')return;
        const box=document.getElementById('error');
        if(box){box.textContent='No se pudo guardar el estudio: '+(e?.message||e);box.hidden=false;}
        else console.error(e);
      }finally{anchor.dataset.mapoSaveBusy='0';setTimeout(()=>URL.revokeObjectURL(href),1000);}
    })();
  };
  window.MAPOFileSave={saveBlob};
})();
