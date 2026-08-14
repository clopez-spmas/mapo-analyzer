/* MAPO Analyzer — motor único de cálculo de factores de hospitalización.
   Recibe siempre los datos que se quieren evaluar. No depende de formData.
   El modelo real del formulario usa tasks/customTasks; mobilizations se admite
   como formato alternativo para compatibilidad. */
(function(){
  'use strict';
  function yn(v){ return v===true || v==='yes'; }
  function num(v){ return Number(v||0); }
  function sumArray(v){ return (Array.isArray(v)?v:[]).reduce((a,x)=>a+num(x),0); }

  function taskEntries(data){
    const tasks=data?.tasks;
    if(tasks && typeof tasks==='object' && Object.keys(tasks).length){
      const result={};
      Object.entries(tasks).forEach(([id,shifts])=>{
        let tm=0,ta=0,pm=0,pa=0;
        Object.values(shifts||{}).forEach(r=>{tm+=num(r?.tm);ta+=num(r?.ta);pm+=num(r?.pm);pa+=num(r?.pa);});
        result[id]={manualTotal:tm,aidedTotal:ta,manualPartial:pm,aidedPartial:pa};
      });
      (Array.isArray(data.customTasks)?data.customTasks:[]).forEach((x,i)=>{
        const id=x.id||`custom_${i}`;
        result[id]={manualTotal:num(x.tm),aidedTotal:num(x.ta),manualPartial:num(x.pm),aidedPartial:num(x.pa)};
      });
      return result;
    }
    const entries=data?.mobilizations?.entries;
    if(entries && typeof entries==='object')return entries;
    return {};
  }

  function rawMobilizationTotals(data){
    let st=0,lta=0,sp=0,lpa=0;
    Object.values(taskEntries(data)).forEach(e=>{
      st+=num(e.manualTotal)+num(e.aidedTotal); lta+=num(e.aidedTotal);
      sp+=num(e.manualPartial)+num(e.aidedPartial); lpa+=num(e.aidedPartial);
    });
    return {st,lta,sp,lpa};
  }

  function taskTotalsFrom(data){
    const entries=taskEntries(data), raw=rawMobilizationTotals(data);
    const overrides=data?.simulationMobilizationRatios||{};
    if(!Object.keys(overrides).length)return {st:raw.st,lta:raw.lta,sp:raw.sp,lpa:raw.lpa,stp:raw.st+raw.sp,pLTA:raw.st?100*raw.lta/raw.st:0,pLPA:raw.sp?100*raw.lpa/raw.sp:0};
    let st=0,lta=0,sp=0,lpa=0;
    Object.entries(entries).forEach(([id,e])=>{
      const totalT=num(e.manualTotal)+num(e.aidedTotal), totalP=num(e.manualPartial)+num(e.aidedPartial), ov=overrides[id]||{};
      st+=totalT; sp+=totalP;
      lta+=ov.total!==undefined&&totalT>0?totalT*Math.max(0,Math.min(100,num(ov.total)))/100:num(e.aidedTotal);
      lpa+=ov.partial!==undefined&&totalP>0?totalP*Math.max(0,Math.min(100,num(ov.partial)))/100:num(e.aidedPartial);
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
  window.MAPOCalculationEngine={taskTotalsFrom,calculateHospitalizacionFactors,taskEntries};
  window.calculateHospitalizacionFactors=calculateHospitalizacionFactors;
})();
