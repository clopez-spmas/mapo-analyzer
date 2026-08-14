/* Compatibilidad con la lectura que usa multi_room.js. */
(function(){
  if(!window.XLSX||typeof window.XLSX.read!=='function')return;
  const original=window.XLSX.read;
  window.XLSX.read=async function(buffer){
    const wb=await original(buffer);
    const ws=wb?.Sheets?.['_MAPO_JSON'];
    if(ws)ws.A1={v:ws._rows?.[0]?.[0]??''};
    return wb;
  };
})();
