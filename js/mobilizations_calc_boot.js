/* Conecta los resultados de la tabla de movilizaciones con FS y FA. */
(function(){
  const original=calculateHospitalizacionFactors;
  window.calculateHospitalizacionFactors=function(d){
    if(d.mobilizations){const m=mobilizationTotals();d.fs_lta_total=m.LTA;d.fs_st_total=m.ST;d.fa_lpa_total=m.LPA;d.fa_sp_total=m.SP;}
    return original(d);
  };
})();
