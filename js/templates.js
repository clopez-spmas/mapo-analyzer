/* Gestión de modelos Word. */
const MAPO_TEMPLATES={hospitalizacion:{name:'Modelo hospitalización',version:'1.0',source:'templates/hospitalizacion.docx'},ambulatorio:{name:'Modelo servicios ambulatorios',version:'1.0',source:'templates/ambulatorio.docx'},quirurgica:{name:'Modelo área quirúrgica',version:'1.0',source:'templates/quirurgica.docx'}};
function templateManagerInfo(){return Object.entries(MAPO_TEMPLATES).map(([key,value])=>({key,...value}));}
function renderTemplateStatus(container){container.innerHTML=templateManagerInfo().map(t=>`<div class="template-status"><strong>${t.name}</strong><span>v${t.version}</span><code>${t.source}</code></div>`).join('');}
function validateTemplateFile(file){if(!file)return{ok:false,message:'No se ha seleccionado ningún archivo.'};if(!file.name.toLowerCase().endsWith('.docx'))return{ok:false,message:'El modelo debe ser un archivo .docx.'};return{ok:true};}
