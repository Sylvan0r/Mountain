const { jsPDF } = window.jspdf;
const form=document.getElementById("recruitForm");
const dialogue=document.getElementById("dialogue");
const speakerName=document.getElementById("speakerName");
const cursor=document.getElementById("cursor");
const progressBar=document.getElementById("progressBar");
const progressLabel=document.getElementById("progressLabel");
const portrait=document.getElementById("portrait");
const uploadLabel=document.getElementById("uploadLabel");
const previewWrap=document.getElementById("previewWrap");
const previewImage=document.getElementById("previewImage");
const previewName=document.getElementById("previewName");
const removePortrait=document.getElementById("removePortrait");
const modal=document.getElementById("modal");
const modalText=document.getElementById("modalText");
const closeModal=document.getElementById("closeModal");
const downloadAgain=document.getElementById("downloadAgain");
const formStage=document.getElementById("formStage");
const openQuestions=document.getElementById("openQuestions");
const closeQuestions=document.getElementById("closeQuestions");
const questionList=document.getElementById("questionList");
const questionCount=document.getElementById("questionCount");
const formArea=document.querySelector(".form-area");

let lastData=null,lastImage=null,typingToken=0,audioCtx=null;

const base={
  start:"Bienvenido al centro de reclutamiento. Tu hogar está en guerra y necesitamos voluntarios para el viaje a la montaña. Siéntate; hay cosas que conviene explicar antes de que firmes.",
  interrogation:"¿Quieres respuestas antes de firmar? De acuerdo. Pregunta cuanto necesites, aunque algunas respuestas están clasificadas incluso para quienes llevan uniforme.",
  name:"¿Tu nombre? Quedará registrado junto a los demás enviados. Procura que no tenga que aprenderlo de una placa conmemorativa.",
  gender:"Registrado. El ejército necesita saber quién parte, aunque los generales sólo parezcan interesados en saber quién regresa.",
  age:"¿{age} años? Hm. La montaña no respeta la edad. Allí arriba, el frío y lo que duerme bajo la piedra tratan a todos por igual.",
  race:"¿{race}? Anotado. En la montaña dicen que la sangre y el origen importan menos que aquello en lo que puedas convertirte al salir.",
  appearance:"Necesito poder reconocerte en la frontera y, si los informes dicen la verdad, después de la prueba. Dame detalles; algunos vuelven con marcas que no tenían al subir.",
  customs:"Costumbres y particularidades... bien. La guerra ya ha cambiado la vida de todos. Y la montaña, según los supervivientes, cambia algo más que eso.",
  portrait:"Un rostro ayuda a recordar a los vivos. Adjunta un retrato; los generales exigen identificar a cada aspirante antes de enviarlo a la montaña.",
  oath:"Lee la declaración con cuidado. No es una excursión: los generales mantienen una prueba en la montaña. Quienes salen de ella hablan de fuego en las manos, gravedad torcida y otras cosas que no deberían ser posibles.",
  done:"Expediente completo. Enhorabuena, recluta. Ahora marcharás hacia una guerra que ya conoces y hacia una montaña que quizá te devuelva con un poder que no sabrás controlar."
};

// Añadir una pregunta nueva sólo requiere incorporar otro objeto a esta lista.
const questions=[
  {id:"officer-name",title:"¿Cuál es su nombre, oficial?",tag:"IDENTIDAD",response:"Oficial Darien Von Voss. Llevo suficiente tiempo en este puesto como para reconocer a un voluntario asustado antes de que se siente."},
  {id:"officer-service",unlockAfter:"officer-name",title:"¿Cuánto tiempo lleva reclutando?",tag:"TRAYECTORIA",response:"Once años. Empecé reclutando para la frontera y terminé enviando gente hacia la montaña. No es una promoción de la que me sienta orgulloso."},
  {id:"war-cause",title:"¿Por qué empezó la guerra?",tag:"ORIGEN DEL CONFLICTO",response:"Empezó con una disputa por los pasos del norte y terminó convirtiéndose en una guerra por el control de los recursos de la montaña. Eso dicen los comunicados. La verdad suele enterrarse antes que los soldados."},
  {id:"war-duration",unlockAfter:"war-cause",title:"¿Cuánto tiempo lleva la guerra?",tag:"DURACIÓN DEL CONFLICTO",response:"Va por su sexto año. Al principio hablábamos de semanas; después, de meses. Ahora los mandos cuentan las estaciones y los soldados contamos los nombres que faltan."},
  {id:"war-enemy",unlockAfter:"war-duration",title:"¿Contra quién es la guerra?",tag:"FUERZAS ENEMIGAS",response:"Contra la coalición de los reinos del norte. Pero no luchamos sólo contra sus ejércitos; también contra sus generales, que buscan el mismo poder que los nuestros encontraron en la montaña."},
  {id:"war-objective",unlockAfter:"war-enemy",title:"¿Cuál es nuestro objetivo en esta guerra?",tag:"OBJETIVO MILITAR",response:"Mantener los pasos, proteger nuestro hogar y evitar que el enemigo llegue a la montaña. En los informes oficiales, eso es todo. En los informes que no llevan sello, la montaña es el verdadero objetivo."},
  {id:"officer-belief",unlockAfter:"war-objective",title:"¿Usted cree que esta guerra es justa?",tag:"OPINIÓN DEL OFICIAL",response:"Creo que hay gente intentando sobrevivir a ambos lados de la frontera. Después de once años, dejé de confundir las órdenes de los generales con la justicia."},
  {id:"mountain",unlockAfter:"officer-belief",title:"¿Qué ocurre realmente en la montaña?",tag:"LA PRUEBA",response:"Los generales la llaman una prueba. Los soldados que vuelven la llaman una puerta. Nadie se pone de acuerdo sobre qué hay al otro lado."},
  {id:"war",unlockAfter:"mountain",title:"¿Por qué nos envían allí durante la guerra?",tag:"ÓRDENES",response:"Porque nuestras fronteras están cayendo y los generales creen que la montaña puede darnos una ventaja. O eso dicen en los informes que nos permiten leer."},
  {id:"supplies",unlockAfter:"war",title:"¿Cuántos días de provisiones tendremos? ¿Recibiremos más durante la misión?",tag:"SUMINISTROS",response:"Partiréis con provisiones para doce días. No hay garantía de recibir más: los convoyes no pueden cruzar todos los pasos y la montaña altera las rutas. Racionad desde el primer amanecer; nadie sabe cuánto durará el regreso."},
  {id:"platoons",unlockAfter:"supplies",title:"¿Cuántos pelotones han enviado ya?",tag:"REGISTRO DE MARCHA",response:"Más de los que aparecen en los informes públicos. Cada pelotón que parte deja de figurar como unidad en cuanto cruza el paso de la montaña. Los altos mandos prefieren llamarlo rotación de personal."},
  {id:"powers",unlockAfter:"platoons",title:"¿Qué habilidades han obtenido los generales?",tag:"HIPÓTESIS DEL RITUAL",response:"Los altos mandos creen que sus habilidades no son un accidente. Suponen que proceden del ritual realizado en la montaña: fuego, gravedad y otras anomalías serían el precio o la recompensa de haberlo completado."},
  {id:"refusal",unlockAfter:"powers",title:"¿Se puede rechazar la prueba?",tag:"ADVERTENCIA",response:"Puedes rechazarla. Nadie puede obligarte a subir. Pero la guerra seguirá esperando abajo, y los generales no suelen olvidar quién decidió quedarse atrás."},
  {id:"war-future",unlockAfter:"refusal",title:"¿Cómo ve el futuro de la guerra? ¿Cree que vamos a ganar?",tag:"PRONÓSTICO",response:"Si seguimos luchando como hasta ahora, no ganaremos; sólo aprenderemos a perder más despacio. Aun así, creo que todavía podemos vencer si encontramos la forma de detener a los generales antes de que conviertan la montaña en un arma."},
  {id:"summit",unlockAfter:"war-future",title:"¿Qué encontraremos en la cumbre?",tag:"ARCHIVO SELLADO",response:"Si lo supiera, no estaría sentado aquí leyendo formularios. La única orden es alcanzar la cumbre, sobrevivir y no aceptar ningún trato que la montaña te ofrezca."}
];

function updateQuestionCount(){
  const visible=questions.filter(isQuestionVisible);
  const asked=visible.filter(question=>question.asked).length;
  questionCount.textContent=`${asked}/${visible.length}`;
}

function isQuestionVisible(question){
  return !question.unlockAfter||questions.some(candidate=>candidate.id===question.unlockAfter&&candidate.asked);
}

function renderQuestions(){
  questionList.innerHTML="";
  const visibleQuestions=questions.filter(isQuestionVisible);
  visibleQuestions.forEach((question,index)=>{
    const button=document.createElement("button");
    button.type="button";
    button.className=`question-card${question.asked?" asked":""}`;
    button.dataset.questionIndex=questions.indexOf(question);
    button.innerHTML=`<span class="question-number">${String(index+1).padStart(2,"0")}</span><span class="question-copy"><strong>${question.title}</strong><small>${question.tag}</small></span><span class="question-state">${question.asked?"RESPONDIDA":"PREGUNTAR"}</span>`;
    button.addEventListener("click",()=>{
      question.asked=true;
      if(question.id==="officer-name")speakerName.textContent="OFICIAL DARÍEN VON VOSS";
      updateQuestionCount();
      sayQuestion(question.response);
      renderQuestions();
    });
    questionList.append(button);
  });
  updateQuestionCount();
}

function sayQuestion(response){
  typeDialogue(response);
}

function soundTick(){
  try{
    audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();
    const o=audioCtx.createOscillator(), g=audioCtx.createGain();
    o.type="square";
    o.frequency.value=95 + Math.random()*45;
    g.gain.setValueAtTime(.0001,audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(.025,audioCtx.currentTime+.004);
    g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+.028);
    o.connect(g).connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+.03);
  }catch(e){}
}

function typeDialogue(text){
  const token=++typingToken; dialogue.textContent=""; cursor.style.opacity=1;
  let i=0;
  const write=()=>{
    if(token!==typingToken)return;
    if(i>=text.length)return;
    const ch=text[i++];
    dialogue.textContent+=ch;
    if(ch.trim())soundTick();
    let delay=28+Math.random()*24;
    if(",;:".includes(ch))delay+=70;
    if(".!?".includes(ch))delay+=170;
    if(ch==="…")delay+=280;
    setTimeout(write,delay);
  };
  write();
}

function say(key){
  const data={
    name:document.getElementById("name").value.trim(),
    age:document.getElementById("age").value,
    race:document.getElementById("race").value.trim()
  };
  let text=base[key]||base.start;
  Object.entries(data).forEach(([k,v])=>text=text.replaceAll(`{${k}}`,v||""));
  typeDialogue(text);
}

const fields=[...form.querySelectorAll("input,select,textarea")];
function updateProgress(){
  const required=fields.filter(x=>x.required);
  const done=required.filter(x=>x.type==="checkbox"?x.checked:x.value.trim()!=="").length;
  const p=Math.round(done/required.length*100);
  progressBar.style.width=p+"%";progressLabel.textContent=p+"%";
}
fields.forEach(el=>{
  el.addEventListener("focus",()=>{
    if((el.id==="age"||el.id==="race")&&!el.value.trim())return;
    say(el.id==="description"?"appearance":el.id);
  });
  el.addEventListener("change",()=>{updateProgress();if(el.id==="portrait")say("portrait");if(el.id==="oath")say("oath")});
  el.addEventListener("input",()=>{
    updateProgress();
    if((el.id==="age"||el.id==="race")&&el.value.trim())say(el.id);
  });
});

portrait.addEventListener("change",()=>{
  const file=portrait.files[0];if(!file)return;
  if(!file.type.startsWith("image/")||file.size>5*1024*1024){alert("El retrato debe ser una imagen de máximo 5 MB.");portrait.value="";return}
  const r=new FileReader();r.onload=e=>{lastImage=e.target.result;previewImage.src=e.target.result;previewName.textContent=file.name;previewWrap.classList.remove("hidden");uploadLabel.classList.add("hidden")};r.readAsDataURL(file);updateProgress();
});
removePortrait.addEventListener("click",()=>{portrait.value="";lastImage=null;previewWrap.classList.add("hidden");uploadLabel.classList.remove("hidden");updateProgress()});

function safe(s){return String(s||"—").replace(/[^\x20-\x7EÀ-ÿ]/g,"?")}

function generatePDF(data){
  const doc=new jsPDF({unit:"mm",format:"a4"});
  const W=210,H=297;
  doc.setFillColor(45,49,40);doc.rect(0,0,W,28,"F");
  doc.setTextColor(224,220,202);doc.setFont("courier","bold");doc.setFontSize(9);doc.text("OFICINA CENTRAL DE RECLUTAMIENTO · DEPARTAMENTO DE GUERRA",14,10);
  doc.setFont("times","bold");doc.setFontSize(18);doc.text("EXPEDIENTE DE ALISTAMIENTO",14,20);
  doc.setFont("courier","normal");doc.setFontSize(7);doc.text("FORM R-17 · FUERZAS ARMADAS DE LA REPÚBLICA DE VEYRA",196,18,{align:"right"});
  doc.setTextColor(40,40,35);doc.setDrawColor(140,120,75);doc.rect(12,37,186,244);
  doc.setFont("courier","bold");doc.setFontSize(8);doc.setTextColor(139,51,43);doc.text("CONFIDENCIAL",18,47);
  doc.setFont("times","bold");doc.setFontSize(19);doc.setTextColor(35,35,30);doc.text("DECLARACIÓN DEL ASPIRANTE",18,59);
  doc.setDrawColor(165,155,130);doc.line(18,64,192,64);
  let y=77;
  const field=(label,val)=>{
    doc.setFont("courier","bold");doc.setFontSize(7);doc.setTextColor(100,96,82);doc.text(label.toUpperCase(),18,y);
    doc.setFont("courier","normal");doc.setFontSize(10);doc.setTextColor(35,35,30);doc.text(safe(val),18,y+6);y+=16;
  };
  field("Nombre",data.name);field("Género",data.gender);field("Edad",data.age);field("Raza",data.race);
  doc.setFont("courier","bold");doc.setFontSize(7);doc.setTextColor(100,96,82);doc.text("DESCRIPCIÓN FÍSICA",18,y);y+=6;
  doc.setFont("courier","normal");doc.setFontSize(9);doc.setTextColor(35,35,30);
  let lines=doc.splitTextToSize(safe(data.appearance),145);doc.text(lines,18,y);y+=Math.max(20,lines.length*5+8);
  doc.setFont("courier","bold");doc.setFontSize(7);doc.setTextColor(100,96,82);doc.text("COSTUMBRES Y PARTICULARIDADES",18,y);y+=6;
  lines=doc.splitTextToSize(safe(data.customs),145);doc.setFont("courier","normal");doc.setFontSize(9);doc.setTextColor(35,35,30);doc.text(lines,18,y);
  if(lastImage){
    try{doc.addImage(lastImage,"JPEG",156,75,31,39);doc.setFontSize(6);doc.text("RETRATO",171.5,118,{align:"center"})}catch(e){}
  }else{
    doc.setDrawColor(150,140,115);doc.rect(156,75,31,43);doc.setFontSize(6);doc.text("SIN RETRATO",171.5,98,{align:"center"});
  }
  doc.setFillColor(139,51,43);doc.setTextColor(245,237,216);doc.rect(156,125,31,10,"F");doc.setFont("courier","bold");doc.setFontSize(6);doc.text("RECLUTA",171.5,131.5,{align:"center"});
  doc.setTextColor(110,105,91);doc.setFont("courier","normal");doc.setFontSize(6);doc.text("DOCUMENTO FICTICIO · CAMPAÑA DE D&D",105,270,{align:"center"});
  doc.setFontSize(7);doc.text("VEYRA · ARCHIVO DE PERSONAL · R-17",105,276,{align:"center"});
  const file="expediente_"+safe(data.name).replace(/\s+/g,"_").replace(/[^a-zA-Z0-9_-]/g,"")+".pdf";
  doc.save(file);
}

form.addEventListener("submit",e=>{
  e.preventDefault();
  if(!form.checkValidity()){form.reportValidity();return}
  lastData={
    name:document.getElementById("name").value.trim(),
    gender:document.getElementById("gender").value,
    age:document.getElementById("age").value,
    race:document.getElementById("race").value.trim(),
    appearance:document.getElementById("appearance").value.trim(),
    customs:document.getElementById("customs").value.trim()
  };
  say("done");
  generatePDF(lastData);
  modalText.textContent=`El expediente de ${lastData.name} ha sido generado correctamente en formato PDF.`;
  modal.classList.remove("hidden");
});
downloadAgain.addEventListener("click",()=>{if(lastData)generatePDF(lastData)});
closeModal.addEventListener("click",()=>modal.classList.add("hidden"));
modal.addEventListener("click",e=>{if(e.target===modal)modal.classList.add("hidden")});
document.addEventListener("keydown",e=>{if(e.key==="Escape")modal.classList.add("hidden")});

openQuestions.addEventListener("click",()=>{
  formArea.scrollTop=0;
  formStage.classList.add("questions-open");
  say("interrogation");
});
closeQuestions.addEventListener("click",()=>{
  formArea.scrollTop=0;
  formStage.classList.remove("questions-open");
});

renderQuestions();say("start");updateProgress();formArea.scrollTop=0;