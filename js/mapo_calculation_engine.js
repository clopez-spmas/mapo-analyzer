/* MAPO Analyzer — motor único de cálculo de factores de hospitalización.
   Recibe siempre los datos que se quieren evaluar. No depende de formData.
   Las fórmulas MAPO se mantienen iguales; la simulación puede aportar
   porcentajes de ayuda mediante simulationMobilizationRatios sin alterar
   los datos originales del estudio.
*/
(function(){
  'use strict';
  function yn(v){ return v===true || v==='yes'; }
  function num(v){ return Number(v||0); }
  function rawMobilizationTotals(data){
    let st=0,lta=0,sp=0,lpa=0;
    const entries=data?.mobilizations?.entries||{};
    Object.values(entries).forEach(e=>{
      (e?.manualTotal||[]).forEach(v=>st+=num(v));
      (e?.aidedTotal||[]).forEach(v=>{st+=num(v);lta+=num(v);});
      (e?.manualPartial||[]).forEach(v=>sp+=num(v));
      (e?.aidedPartial||[]).forEach(v=>{sp+=num(v);lpa+=num(v);});
    });
    return {st,lta,sp,lpa};
  }
  function taskTotalsFrom(data){
    const raw=rawMobilizationTotals(data);
    const overrides=data?.simulationMobilizationRatios||{};
    if(!Object.keys(overrides).length)return {st:raw.st,lta:raw.lta,sp:raw.sp,lpa:raw.lpa,stp:raw.st+raw.sp,pLTA:raw.st?100*raw.lta/raw.st:0,pLPA:raw.sp?100*raw.lpa/raw.sp:0};
    let st=0,lta=0,sp=0,lpa=0;
    Object.entries(data?.mobilizations?.entries||{}).forEach(([id,e])=>{
      const totalT=(e?.manualTotal||[]).reduce((a,v)=>a+num(v),0)+(e?.aidedTotal||[]).reduce((a,v)=>a+num(v),0);
      const totalP=(e?.manualPartial||[]).reduce((a,v)=>a+num(v),0)+(e?.aidedPartial||[]).reduce((a,v)=>a+num(v),0);
      const ov=overrides[id]||{};
      if(ov.total!==undefined&&totalT>0){st+=totalT;lta+=totalT*Math.max(0,Math.min(100,num(ov.total)))/100;}else{st+=totalT;lta+=(e?.aidedTotal||[]).reduce((a,v)=>a+num(v),0);}
      if(ov.partial!==undefined&&totalP>0){sp+=totalP;lpa+=totalP*Math.max(0,Math.min(100,num(ov.partial)))/100;}else{sp+=totalP;lpa+=(e?.aidedPartial||[]).reduce((a,v)=>a+num(v),0);}
    });
    return {st,lta,sp,lpa,stp:st+sp,pLTA:st?100*lta/st:0,pLPA:sp?100*lpa/sp:0};
  }
  function calculateHospitalizacionFactors(data){
    const d=data||{},tt=taskTotalsFrom(d);
    const fsS=yn(d.fs_elevadores)||yn(d.fs_camillas)||yn(d.fs_camas3),fsA=tt.st>0&&tt.lta/tt.st>=.9,fs=!fsS&&!fsA?4:fsS&&fsA?.5:2;
    const faS=(yn(d.fa_sabana)&&yn(d.fa_dos))||(yn(d.fa_sabana)&&yn(d.fa_camas3)),faA=tt.sp>0&&tt.lpa/tt.sp>=.9,fa=faS&&faA?.5:1;
    const na=num(d.nc)+num(d.pc),chairs=num(d.fc_sillas),pmsr=num(d.fc_pmsr),fcS=chairs>=na*.5;
    const fc=pmsr<=1.33?(fcS?.75:1):pmsr<=2.66?(fcS?1.12:1.5):(fcS?1.5:2);
    const pmb=num(d.famb_pmb),pmwc=num(d.famb_pmwc),pmh=num(d.famb_pmh),pmamb=pmb+pmwc+pmh,famb=pmamb<=5.8?.75:pmamb<=11.6?1.25:1.5;
    const course=yn(d.ff_curso),cov=num(d.ff_cobertura),recent=yn(d.ff_antiguedad),eff=yn(d.ff_eficacia),info=yn(d.ff_informacion),ff=(course&&cov>=75&&(recent||eff))?.75:(course&&cov>=50&&cov<75&&recent)||info?1:2;
    return {fs,fa,fc,famb,ff,taskTotals:tt,details:{fsSufficient:fsS,fsAdequate:fsA,faSufficient:faS,faAdequate:faA,pmsr,pmamb,pmB:pmb,pmWC:pmwc,pmH:pmh,fcSufficient:fcS}};
  }
  window.MAPOCalculationEngine={taskTotalsFrom,calculateHospitalizacionFactors};
  window.calculateHospitalizacionFactors=calculateHospitalizacionFactors;
})();
