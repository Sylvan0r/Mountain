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
const speech=document.querySelector(".speech");
const dialogueMore=document.getElementById("dialogueMore");
const officerPortrait=document.getElementById("officerPortrait");
const officerCloseImage="img/close.png";
const officerOpenImage="img/open.png";
const musicToggle=document.getElementById("musicToggle");
const musicVolume=document.getElementById("musicVolume");
const musicVolumeLabel=document.getElementById("musicVolumeLabel");
const soundState=document.getElementById("soundState");

let lastData=null,lastImage=null,typingToken=0,audioCtx=null,typingTimer=null,activeDialogueText="",dialogueFullText="",dialogueChunkSize=220,dialogueVisibleLength=0;

const statsConfig=[
  {key:"vitalidad",label:"Vitalidad",description:"Resistencia y aguante"},
  {key:"fuerza",label:"Fuerza",description:"Potencia física"},
  {key:"destreza",label:"Destreza",description:"Precisión y reflejos"},
  {key:"agilidad",label:"Agilidad",description:"Velocidad y movilidad"},
  {key:"carisma",label:"Carisma",description:"Presencia y liderazgo"},
  {key:"inteligencia",label:"Inteligencia",description:"Razonamiento y sabiduría"},
  {key:"mente",label:"Mente",description:"Concentración y poder mágico"},
  {key:"suerte",label:"Suerte",description:"Fortuna e instinto"}
];

const MAX_TOTAL_POINTS=20;
const MIN_STAT_VALUE=0;
const MAX_STAT_VALUE=10;
const BASE_RESOURCE_VALUE=10;
const MAX_RESOURCE_VALUE=20;
const stats=statsConfig.map(stat=>({ ...stat, value: MIN_STAT_VALUE }));
const statsGrid=document.getElementById("statsGrid");
const statsSummary=document.getElementById("statsSummary");
const healthBar=document.getElementById("healthBar");
const healthValue=document.getElementById("healthValue");
const manaBar=document.getElementById("manaBar");
const manaValue=document.getElementById("manaValue");
const statDialog=document.getElementById("statDialog");
const statDialogText=document.getElementById("statDialogText");
const closeStatDialog=document.getElementById("closeStatDialog");

const base={
  start:"Bienvenido al centro de reclutamiento. Tu hogar está en guerra y necesitamos voluntarios para el viaje a la montaña. Siéntate; hay cosas que conviene explicar antes de que firmes.",
  interrogation:"¿Quieres respuestas antes de firmar? De acuerdo. Pregunta cuanto necesites, aunque algunas respuestas están clasificadas incluso para quienes llevan uniforme.",
  name:"¿Tu nombre? Quedará registrado junto a los demás enviados. Procura que no tenga que aprenderlo de una placa conmemorativa.",
  gender:"Registrado. El ejército necesita saber quién parte, aunque los generales sólo parezcan interesados en saber quién regresa.",
  age:"¿{age} años? Hm. La montaña no respeta la edad. Allí arriba, el frío y lo que duerme bajo la piedra tratan a todos por igual.",
  race:"¿{race}? Anotado. En la montaña dicen que la sangre y el origen importan menos que aquello en lo que puedas convertirte al salir.",
  appearance:"Necesito poder reconocerte en la frontera y, si los informes dicen la verdad, después de la prueba. Dame detalles; algunos vuelven con marcas que no tenían al subir.",
  armament:"Armamento especial... bien. Si no traes un arma propia, el intendente asignará una pieza básica según tus aptitudes.",
  portrait:"Un rostro ayuda a recordar a los vivos. Adjunta un retrato; los generales exigen identificar a cada aspirante antes de enviarlo a la montaña.",
  oath:"Lee la declaración con cuidado. No es una excursión: los generales mantienen una prueba en la montaña. Quienes salen de ella hablan de fuego en las manos, gravedad torcida y otras cosas que no deberían ser posibles.",
  done:"Expediente completo. Enhorabuena, recluta. Ahora marcharás hacia una guerra que ya conoces y hacia una montaña que quizá te devuelva con un poder que no sabrás controlar."
};

// Añadir una pregunta nueva sólo requiere incorporar otro objeto a esta lista.
const questions=[
  {id:"officer-name",title:"¿Cuál es su nombre, oficial?",tag:"IDENTIDAD",response:"Oficial Darien Von Voss. Llevo suficiente tiempo en este puesto como para reconocer a un voluntario asustado antes de que se siente."},
  {id:"officer-service",unlockAfter:"officer-name",title:"¿Cuánto tiempo lleva reclutando?",tag:"TRAYECTORIA",response:"Once años. Empecé reclutando para la frontera y ahora estoy aquí, enviando gente hacia la montaña. No es una promoción de la que me sienta orgulloso."},
  {id:"war-cause",title:"¿Por qué empezó la guerra?",tag:"ORIGEN DEL CONFLICTO",response:"El Reino del Cártel de la Pura, o como prefieran llamarlo los historiadores, se vio 'obligado' a expandirse por motivos desconocidos, y los reinos del norte no quisieron dar sus tierras. También hay presión desde el este, siendo nosotros. Básicamente lo que uno esperaría: es el control de puntos estratégicos. Y como somos del este, estamos muy cerca de esa amenaza: somos la región que se encuentra a la espalda del mar, pero no por eso estamos lejos del conflicto."},
  {id:"war-duration",unlockAfter:"war-cause",title:"¿Cuánto tiempo lleva la guerra?",tag:"DURACIÓN DEL CONFLICTO",response:"Va por su sexto año. Al principio hablábamos de semanas; después, de meses. Ahora los mandos cuentan las estaciones y los soldados contamos los nombres que faltan."},
  {id:"war-enemy",unlockAfter:"war-duration",title:"¿Contra quién es la guerra?",tag:"FUERZAS ENEMIGAS",response:"No estamos peleando sólo contra el norte. Estamos luchando contra el reino de la cordillera y contra los ejércitos del norte, que han hecho que el conflicto se vuelva imposible de cerrar por medios diplomáticos. El este no es neutral: somos parte del problema, pero también somos parte de la resistencia, y por eso la republica de Veyra nos está reclutando."},
  {id:"east-front",unlockAfter:"war-enemy",title:"¿Los del este están con nosotros?",tag:"FRONTERA DEL ESTE",response:"Sí. Los del este estamos con la República de Veyra. Somos la gente que nació entre el mar y la frontera, la que ve cada día el peso del conflicto. Por eso mismo nos alistan aquí: no por ser más valientes, sino porque estamos más cerca de la guerra y de la amenaza que llega desde el norte y desde la cordillera."},
  {id:"enemy-ship",unlockAfter:"east-front",title:"¿Vamos a tener que cruzar el mar?",tag:"TRASLADO",response:"Sí. El viaje por mar está garantizado. La mayoría de los reclutas no cruza la cordillera a pie ni de golpe. Algunos tendrán que llegar al frente por barco, y no será un viaje tranquilo. El transporte no será amable; será militar, a menudo capturado, y siempre vigilado por la misma amenaza a la que se dirigen."},
  {id:"collars",unlockAfter:"enemy-ship",title:"¿Qué ocurre con los miembros de razas peligrosas?",tag:"CONTROL MILITAR",response:"Hay collares. No son adornos. Los llevan algunos de la milicia y algunos reclutados con sangre peligrosa o con rasgos que los mandos consideran incontrolables. Son dispositivos de control para vigilarlos, marcarlos y, si hace falta, detenerlos. Los superiores pueden ver su pulso, su fuerza y su intención como si fueran su propio reloj."},
  {id:"war-objective",unlockAfter:"collars",title:"¿Cuál es nuestro objetivo en esta guerra?",tag:"OBJETIVO MILITAR",response:"Mantener los pasos, proteger nuestro hogar y evitar que el enemigo llegue al interior. En los informes oficiales, eso es todo. Pero los expertos saben que la verdadera prioridad es impedir que el reino de la cordillera consolide su poder sobre los puertos y la cadena montañosa."},
  {id:"officer-belief",unlockAfter:"war-objective",title:"¿Usted cree que esta guerra es justa?",tag:"OPINIÓN DEL OFICIAL",response:"Creo que hay gente intentando sobrevivir a ambos lados de la frontera. Después de once años, dejé de confundir las órdenes de los generales con la justicia. Lo que deciden los mandos no siempre coincide con lo que la gente necesita."},
  {id:"mountain",unlockAfter:"officer-belief",title:"¿Qué ocurre realmente en esa montaña?",tag:"LA PRUEBA",response:"Los altos mandos dan por hecho que es algo anómalo, quizá más peligroso que natural. Pero eso es una suposición, no un hecho probado. Lo único que sabemos con certeza es que ese lugar altera la lógica, ya que segun las suposiciones esa es la última prueba de los generales enemigos."},
  {id:"powers",unlockAfter:"mountain",title:"¿Los generales enemigos no son normales?",tag:"HIPÓTESIS DEL RITUAL",response:"Eso es precisamente una hipótesis de los altos mandos. No hay confirmación ni archivo que lo afirme como verdad. Lo único que se sabe es que algunos generales han demostrado capacidades fuera de lo común, pero nadie ha podido demostrar si es el ritual, la cordillera o un poder ajeno a la guerra."},
  {id:"generals",unlockAfter:"powers",title:"¿Hay algun general enemigo a tener en cuenta?",tag:"ARCHIVO DE GENERALES",response:"Poca información fiable por la falta de supervivientes. Se dice que uno puede controlar el agua y crear ráfagas que cortan el acero como si fuera tela. Y también se ha documentado otra figura, aunque mucho menos documentada. Parece ser alguien capaz de crear fuego en cantidades inmensas. No hay más datos, más que datos hay pruebas, con zonas de batallas calcinadas. Eso basta para que la gente se asuste."},
  {id:"refusal",unlockAfter:"generals",title:"¿Se puede rechazar la prueba?",tag:"ADVERTENCIA",response:"Puedes rechazarla. Nadie puede obligarte a subir. Pero la guerra seguirá esperando abajo, y los generales no suelen olvidar quién decidió quedarse atrás. El collar no lo hace mejor, y quienes se resisten a la autoridad militar rara vez tienen un futuro largo."},
  {id:"war-future",unlockAfter:"refusal",title:"¿Cómo ve el futuro de la guerra? ¿Cree que vamos a ganar?",tag:"PRONÓSTICO",response:"Si seguimos luchando como hasta ahora, no ganaremos; sólo aprenderemos a perder más despacio. Aun así, creo que todavía podemos vencer si encontramos la forma de detener a los generales antes de que conviertan la cordillera en un arma."},
  {id:"supplies",unlockAfter:"war-future",title:"¿Cuántos días de provisiones tendremos?",tag:"SUMINISTROS",response:"Partiréis con provisiones para doce días. No hay garantía de recibir más: los convoyes no pueden cruzar todos los pasos y la cordillera altera las rutas. Racionad desde el primer amanecer; nadie sabe cuánto durará el regreso."},
  {id:"summit",unlockAfter:"supplies",title:"¿Qué encontraremos en la cima?",tag:"ARCHIVO SELLADO",response:"Si lo supiera, no estaría sentado aquí leyendo formularios. La única orden es alcanzar la cima, sobrevivir y no aceptar ningún trato que la cordillera te ofrezca. Y si te ofrece algo, hazte a la idea de que no te lo va a ofrecer por tu bien."}
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

function updateDialogueIndicator(){
  const hasMore = Boolean(dialogueFullText) && dialogueVisibleLength < dialogueFullText.length;
  dialogueMore?.classList.toggle("visible", hasMore);
  if (dialogue.scrollHeight > dialogue.clientHeight) {
    dialogue.scrollTop = dialogue.scrollHeight;
  }
}

function revealFullDialogue(){
  if (!dialogueFullText) return;
  if (typingTimer) {
    clearTimeout(typingTimer);
    typingTimer = null;
  }

  dialogueVisibleLength = dialogueFullText.length;
  dialogue.textContent = dialogueFullText;
  activeDialogueText = "";
  dialogueFullText = "";
  cursor.style.opacity = 0;
  if(officerPortrait) officerPortrait.src=officerCloseImage;
  dialogueMore?.classList.remove("visible");
  dialogue.scrollTop = dialogue.scrollHeight;
}

function finishDialogue(){
  revealFullDialogue();
}

function typeDialogue(text){
  if (typingTimer) clearTimeout(typingTimer);

  typingToken++;
  const token = typingToken;
  activeDialogueText = text;
  dialogueFullText = text;
  dialogueVisibleLength = 0;
  dialogue.textContent = "";
  cursor.style.opacity = 1;
  if(officerPortrait) officerPortrait.src=officerOpenImage;
  dialogueMore?.classList.remove("visible");

  const write = () => {
    if (token !== typingToken) return;

    if (dialogueVisibleLength >= text.length) {
      activeDialogueText = "";
      dialogueFullText = "";
      dialogueVisibleLength = 0;
      cursor.style.opacity = 0;
      if(officerPortrait) officerPortrait.src=officerCloseImage;
      dialogueMore?.classList.remove("visible");
      return;
    }

    dialogueVisibleLength += 1;
    const ch = text[dialogueVisibleLength - 1];
    dialogue.textContent = text.slice(0, dialogueVisibleLength);

    if (ch && ch.trim()) soundTick();

    let delay = 18 + Math.random() * 40;
    if (",;:".includes(ch)) delay += 35;
    if (".!?".includes(ch)) delay += 55;
    if (ch === "…") delay += 90;

    typingTimer = setTimeout(write, delay);
    updateDialogueIndicator();
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

function getSpentPoints(){
  return stats.reduce((sum, stat)=>sum + Math.max(0, stat.value - MIN_STAT_VALUE), 0);
}

function getAvailableStatsPoints(){
  return MAX_TOTAL_POINTS - getSpentPoints();
}

function getStatValue(key){
  return stats.find(stat=>stat.key===key)?.value || MIN_STAT_VALUE;
}

function getResourceValue(key){
  return BASE_RESOURCE_VALUE + getStatValue(key);
}

function renderResourceBars(){
  const health=getResourceValue("vitalidad");
  const mana=getResourceValue("mente");
  const healthPercent=(health / MAX_RESOURCE_VALUE) * 100;
  const manaPercent=(mana / MAX_RESOURCE_VALUE) * 100;

  if(healthBar) healthBar.style.width=`${healthPercent}%`;
  if(healthValue) healthValue.textContent=`${health} / ${MAX_RESOURCE_VALUE}`;
  if(manaBar) manaBar.style.width=`${manaPercent}%`;
  if(manaValue) manaValue.textContent=`${mana} / ${MAX_RESOURCE_VALUE}`;
}

function showStatDialog(message){
  if(!statDialog || !statDialogText) return;
  statDialogText.textContent = message;
  statDialog.classList.remove("hidden");
}

function renderHexagon(){
  const svg=document.getElementById("statsHexagon");
  const shape=document.getElementById("statsHexagonShape");
  const labels=document.getElementById("hexagonLabels");
  if(!svg || !shape || !labels) return;

  const centerX=110;
  const centerY=110;
  const innerRadius=30;
  const outerRadius=82;
  const points=[];
  const labelGroup=[];
  const angleStep=360 / stats.length;

  stats.forEach((stat, index)=>{
    const angle=(-90 + index * angleStep) * (Math.PI / 180);
    const normalized = (stat.value - MIN_STAT_VALUE) / (MAX_STAT_VALUE - MIN_STAT_VALUE);
    const radius = innerRadius + normalized * (outerRadius - innerRadius);
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`);

    const labelX = centerX + Math.cos(angle) * (outerRadius + 18);
    const labelY = centerY + Math.sin(angle) * (outerRadius + 18);

    labelGroup.push(`
      <text x="${labelX.toFixed(2)}" y="${labelY.toFixed(2)}" text-anchor="middle" dominant-baseline="middle" class="hex-label">${stat.label.slice(0, 3).toUpperCase()}</text>
    `);
  });

  const basePoints=stats.map((stat,index)=>{
    const angle=(-90 + index * angleStep) * (Math.PI / 180);
    return `${(centerX + Math.cos(angle) * outerRadius).toFixed(2)},${(centerY + Math.sin(angle) * outerRadius).toFixed(2)}`;
  }).join(" ");

  svg.querySelector(".hexagon-base")?.setAttribute("points",basePoints);
  svg.setAttribute("data-shape", points.join(" "));
  shape.setAttribute("points", points.join(" "));
  labels.innerHTML = labelGroup.join("");
  svg.setAttribute("aria-label", `Polígono de estadísticas: ${stats.map(s => `${s.label} ${s.value}`).join(", ")}`);
}

function renderStats(){
  if(!statsGrid)return;

  const remaining = getAvailableStatsPoints();
  if(statsSummary) {
    statsSummary.textContent = `Puntos disponibles: ${remaining} / ${MAX_TOTAL_POINTS}`;
  }

  statsGrid.innerHTML="";
  stats.forEach(stat=>{
    const card=document.createElement("div");
    card.className="stat-card";
    const isMin = stat.value <= MIN_STAT_VALUE;
    const isMax = stat.value >= MAX_STAT_VALUE;
    const wouldExceedLimit = getAvailableStatsPoints() <= 0;
    card.innerHTML=`
      <div class="stat-info">
        <strong>${stat.label}</strong>
        <small>${stat.description}</small>
      </div>
      <div class="stat-controls">
        <button type="button" class="stat-button" data-stat="${stat.key}" data-action="decrease" aria-label="Disminuir ${stat.label}" ${isMin ? "disabled" : ""}>−</button>
        <span class="stat-value">${stat.value}</span>
        <button type="button" class="stat-button" data-stat="${stat.key}" data-action="increase" aria-label="Aumentar ${stat.label}" ${isMax || wouldExceedLimit ? "disabled" : ""}>+</button>
      </div>
    `;
    statsGrid.appendChild(card);
  });

  renderResourceBars();
  renderHexagon();
}

function getStatsSummary(){
  return stats.map(stat=>`${stat.label}: ${stat.value}`).join(" | ");
}

function getResourceSummary(){
  return {
    health:getResourceValue("vitalidad"),
    mana:getResourceValue("mente")
  };
}

function getDefaultArmament(){
  const weaponByStat={
    vitalidad:"martillo de guerra",
    fuerza:"espada corta y escudo",
    destreza:"arco corto",
    agilidad:"dagas gemelas",
    carisma:"sable de mando",
    inteligencia:"báculo táctico",
    mente:"foco rúnico",
    suerte:"pistola de chispa"
  };
  const bestStats=stats
    .filter(stat=>stat.value>0)
    .sort((a,b)=>b.value-a.value)
    .slice(0,2);
  if(!bestStats.length) return "espada corta y escudo de campaña";
  return bestStats.map(stat=>weaponByStat[stat.key]).join(" y ");
}

function safe(s){
  return String(s || "—").replace(/[^\x20-\x7EÀ-ÿ·|/–—]/g, "?");
}

function getPdfHexagonPoints(cx, cy, radius){
  return stats.map((stat,index)=>{
    const angle = (-90 + index * (360 / stats.length)) * (Math.PI / 180);
    const normalized = (stat.value - MIN_STAT_VALUE) / (MAX_STAT_VALUE - MIN_STAT_VALUE);
    const radial = 12 + normalized * (radius - 12);
    return {
      x: cx + Math.cos(angle) * radial,
      y: cy + Math.sin(angle) * radial,
      labelX: cx + Math.cos(angle) * (radius + 4),
      labelY: cy + Math.sin(angle) * (radius + 4),
      valueX: cx + Math.cos(angle) * (radial - 6),
      valueY: cy + Math.sin(angle) * (radial - 6),
      label: stat.label.slice(0, 3).toUpperCase(),
      value: stat.value,
      angle
    };
  });
}

function drawPdfHexagon(doc, cx, cy, radius){
  const points = getPdfHexagonPoints(cx, cy, radius);
  const outerPoints = stats.map((stat,index)=>{
    const angle = (-90 + index * (360 / stats.length)) * (Math.PI / 180);
    return {
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius
    };
  });

  const drawPolygon = polygon => polygon.forEach((point,index)=>{
    const next=polygon[(index + 1) % polygon.length];
    doc.line(point.x, point.y, next.x, next.y);
  });

  doc.setDrawColor(168, 146, 103);
  doc.setLineWidth(0.55);
  drawPolygon(outerPoints);

  doc.setDrawColor(139, 51, 43);
  doc.setLineWidth(1);
  drawPolygon(points);

  doc.setTextColor(58, 52, 42);
  doc.setFont("courier", "bold");
  doc.setFontSize(4.8);
  points.forEach(point=>{
    doc.text(point.label, point.labelX, point.labelY + 0.8, { align: "center" });
  });
}

function drawPdfResourceBar(doc, x, y, width, label, value, color){
  doc.setFont("courier", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(58, 52, 42);
  doc.text(label, x, y);
  doc.setFont("courier", "normal");
  doc.text(`${value} / ${MAX_RESOURCE_VALUE}`, x + width, y, {align:"right"});
  doc.setFillColor(211, 202, 178);
  doc.roundedRect(x, y + 3, width, 4, 1, 1, "F");
  doc.setFillColor(...color);
  doc.roundedRect(x, y + 3, Math.max(2, width * (value / MAX_RESOURCE_VALUE)), 4, 1, 1, "F");
}

function generatePDF(data){
  const doc=new jsPDF({unit:"mm",format:"a4"});
  const W=210,H=297;

  doc.setFillColor(42, 45, 38);
  doc.rect(0, 0, W, 29, "F");
  doc.setTextColor(230, 224, 208);
  doc.setFont("courier", "bold");
  doc.setFontSize(8);
  doc.text("OFICINA CENTRAL DE RECLUTAMIENTO · DEPARTAMENTO DE GUERRA", 14, 10);
  doc.setFont("times", "bold");
  doc.setFontSize(17);
  doc.text("EXPEDIENTE DE ALISTAMIENTO", 14, 19);
  doc.setFont("courier", "normal");
  doc.setFontSize(6.5);
  doc.text("FORM R-17 · REPÚBLICA DE VEYRA", 196, 18, { align: "right" });

  doc.setTextColor(35, 35, 32);
  doc.setDrawColor(156, 138, 100);
  doc.setLineWidth(0.7);
  doc.rect(12, 34, 186, 247);

  doc.setFillColor(239, 233, 216);
  doc.roundedRect(18, 42, 170, 30, 3, 3, "F");
  doc.setTextColor(58, 52, 42);
  doc.setFont("courier", "bold");
  doc.setFontSize(6.5);
  doc.text("REINO DE VEYRA · ARCHIVO DE PERSONAL", 25, 53);
  doc.setFont("times", "bold");
  doc.setFontSize(14);
  doc.text(safe(data.name), 25, 63);
  doc.setFont("courier", "normal");
  doc.setFontSize(7);
  doc.text(`Género: ${safe(data.gender)} · Edad: ${safe(data.age)} · Raza: ${safe(data.race)}`, 25, 69);

  if(lastImage){
    try {
      doc.roundedRect(17, 78, 36, 44, 3, 3, "S");
      doc.addImage(lastImage, "JPEG", 19, 80, 32, 40);
      doc.setTextColor(78, 70, 58);
      doc.setFont("courier", "bold");
      doc.setFontSize(6);
      doc.text("RETRATO", 35, 123, { align: "center" });
    } catch (e) {
      doc.setDrawColor(150, 140, 115);
      doc.roundedRect(17, 78, 36, 44, 3, 3, "S");
      doc.setTextColor(78, 70, 58);
      doc.setFont("courier", "bold");
      doc.setFontSize(6);
      doc.text("SIN RETRATO", 35, 101, { align: "center" });
    }
  } else {
    doc.setDrawColor(150, 140, 115);
    doc.roundedRect(17, 78, 36, 44, 3, 3, "S");
    doc.setTextColor(78, 70, 58);
    doc.setFont("courier", "bold");
    doc.setFontSize(6);
    doc.text("SIN RETRATO", 35, 101, { align: "center" });
  }

  doc.setFillColor(239, 233, 216);
  doc.roundedRect(58, 78, 130, 44, 3, 3, "F");
  doc.setTextColor(58, 52, 42);
  doc.setFont("courier", "bold");
  doc.setFontSize(6.5);
  doc.text("RESUMEN", 68, 87);
  doc.setFont("courier", "normal");
  doc.setFontSize(7.2);
  const details = [
    `Nombre: ${safe(data.name)}`,
    `Género: ${safe(data.gender)}`,
    `Edad: ${safe(data.age)}`,
    `Raza: ${safe(data.race)}`
  ];
  let detailY = 95;
  details.forEach(line => {
    doc.text(line, 68, detailY);
    detailY += 7;
  });

  const hexX = 57;
  const hexY = 171;
  const hexR = 19;
  const resources=getResourceSummary();
  doc.setFillColor(239, 233, 216);
  doc.roundedRect(17, 132, 171, 78, 3, 3, "F");
  doc.setTextColor(58, 52, 42);
  doc.setFont("courier", "bold");
  doc.setFontSize(6.5);
  doc.text("ESTADÍSTICAS DEL ASPIRANTE", 27, 142);
  drawPdfHexagon(doc, hexX, hexY, hexR);
  doc.setFont("courier", "normal");
  doc.setFontSize(6.8);
  stats.forEach((stat, index)=>{
    const rowY=149 + index * 5.2;
    doc.setTextColor(58, 52, 42);
    doc.text(stat.label.toUpperCase(), 132, rowY);
    doc.setFont("courier", "bold");
    doc.text(String(stat.value), 184, rowY, {align:"right"});
    doc.setFont("courier", "normal");
  });
  drawPdfResourceBar(doc, 105, 198, 36, "VIDA", resources.health, [139, 51, 43]);
  drawPdfResourceBar(doc, 151, 198, 36, "MANÁ", resources.mana, [63, 92, 119]);

  doc.setFillColor(239, 233, 216);
  doc.roundedRect(17, 216, 82, 40, 3, 3, "F");
  doc.setTextColor(58, 52, 42);
  doc.setFont("courier", "bold");
  doc.setFontSize(6.5);
  doc.text("DESCRIPCIÓN FÍSICA", 25, 226);
  doc.setFont("courier", "normal");
  doc.setFontSize(6.8);
  const appearanceLines = doc.splitTextToSize(safe(data.appearance), 66);
  doc.text(appearanceLines, 25, 235);

  doc.setFillColor(239, 233, 216);
  doc.roundedRect(108, 216, 80, 40, 3, 3, "F");
  doc.setTextColor(58, 52, 42);
  doc.setFont("courier", "bold");
  doc.setFontSize(6.5);
  doc.text("ARMAMENTO ESPECIAL", 116, 226);
  doc.setFont("courier", "normal");
  doc.setFontSize(6.8);
  const armamentLines = doc.splitTextToSize(safe(data.armament), 64);
  doc.text(armamentLines, 116, 235);

  doc.setFillColor(43, 47, 39);
  doc.rect(18, 252, 170, 18, "F");
  doc.setTextColor(230, 224, 208);
  doc.setFont("courier", "bold");
  doc.setFontSize(7);
  doc.text("ARCHIVO DE PERSONAL · VEYRA · R-17", 105, 262, { align: "center" });

  doc.setTextColor(110, 105, 91);
  doc.setFont("courier", "normal");
  doc.setFontSize(6);
  doc.text("DOCUMENTO FICTICIO · CAMPAÑA DE D&D", 105, 279, { align: "center" });

  const file="expediente_"+safe(data.name).replace(/\s+/g,"_").replace(/[^a-zA-Z0-9_-]/g,"")+".pdf";
  doc.save(file);
}

form.addEventListener("submit",e=>{
  e.preventDefault();
  const requiredFields=[
    ["name","el nombre"],
    ["gender","el género"],
    ["age","la edad"],
    ["race","la raza"],
    ["appearance","la descripción física"]
  ];
  const missing=requiredFields
    .filter(([id])=>!document.getElementById(id).value.trim())
    .map(([,label])=>label);
  if(!document.getElementById("oath").checked) missing.push("la declaración");
  if(getSpentPoints()<=0) missing.push("al menos un punto de estadísticas");

  if(missing.length){
    showStatDialog(`No se puede generar el expediente. Completa: ${missing.join(", ")}.`);
    return;
  }
  if(!form.checkValidity()){form.reportValidity();return}
  lastData={
    name:document.getElementById("name").value.trim(),
    gender:document.getElementById("gender").value,
    age:document.getElementById("age").value,
    race:document.getElementById("race").value.trim(),
    appearance:document.getElementById("appearance").value.trim(),
    armament:document.getElementById("armament").value.trim() || getDefaultArmament(),
    stats:getStatsSummary()
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

const audioFile = new URL("sfx/bgs.mp3", document.baseURI).href;
let bgmAudio = null;
let musicMuted = false;

function ensureBgm(){
  if(!bgmAudio){
    bgmAudio = new Audio(audioFile);
    bgmAudio.loop = true;
    bgmAudio.volume = Number(musicVolume?.value || 3) / 100;
    bgmAudio.preload = "auto";
    bgmAudio.addEventListener("playing",()=>{
      if(soundState) soundState.textContent="AUDIO · ACTIVO";
    });
    bgmAudio.addEventListener("pause",()=>{
      if(soundState && !bgmAudio.ended) soundState.textContent="AUDIO · PAUSADO";
    });
    bgmAudio.addEventListener("error",()=>{
      if(soundState) soundState.textContent="AUDIO · NO DISPONIBLE";
    });
  }
  bgmAudio.muted = musicMuted;
  const playback=bgmAudio.play();
  playback?.catch(()=>{
    if(soundState) soundState.textContent="AUDIO · PULSA PARA ACTIVAR";
  });
}

function updateMusicControls(){
  const volume=Number(musicVolume?.value || 0);
  if(bgmAudio) bgmAudio.volume=volume / 100;
  if(musicVolumeLabel) musicVolumeLabel.textContent=`${volume}%`;
  if(musicToggle){
    musicToggle.setAttribute("aria-pressed",String(musicMuted));
    musicToggle.setAttribute("aria-label",musicMuted?"Activar música":"Silenciar música");
    musicToggle.textContent=musicMuted?"×":"♫";
  }
}

if (document.visibilityState === "visible") {
  ensureBgm();
}

document.addEventListener("visibilitychange",()=>{
  if(document.visibilityState === "visible") ensureBgm();
});

document.addEventListener("pointerdown",()=>ensureBgm(),{once:true});

musicVolume?.addEventListener("input",()=>{
  ensureBgm();
  updateMusicControls();
});
musicToggle?.addEventListener("click",()=>{
  musicMuted=!musicMuted;
  ensureBgm();
  updateMusicControls();
});
updateMusicControls();

openQuestions.addEventListener("click",()=>{
  formArea.scrollTop=0;
  formStage.classList.add("questions-open");
  say("interrogation");
});
closeQuestions.addEventListener("click",()=>{
  formArea.scrollTop=0;
  formStage.classList.remove("questions-open");
});

document.addEventListener("click",event=>{
  const button=event.target.closest(".stat-button");
  if(!button)return;
  const stat=stats.find(item=>item.key===button.dataset.stat);
  if(!stat)return;
  const delta=button.dataset.action==="increase"?1:-1;
  const nextAvailable = getAvailableStatsPoints() - delta;

  if(delta > 0 && nextAvailable < 0){
    showStatDialog(`Has alcanzado el límite de ${MAX_TOTAL_POINTS} puntos. Distribuye mejor tus atributos antes de asignar más.`);
    return;
  }

  if(delta < 0 && stat.value <= MIN_STAT_VALUE){
    return;
  }

  stat.value=Math.max(MIN_STAT_VALUE,Math.min(MAX_STAT_VALUE,stat.value+delta));
  renderStats();
});

closeStatDialog.addEventListener("click",()=>statDialog.classList.add("hidden"));
statDialog.addEventListener("click",e=>{if(e.target===statDialog)statDialog.classList.add("hidden")});

document.addEventListener("keydown",e=>{if(e.key==="Escape" && !statDialog.classList.contains("hidden"))statDialog.classList.add("hidden")});

if(speech){
  speech.addEventListener("click",()=>{
    if (typingTimer) {
      clearTimeout(typingTimer);
      typingTimer = null;
    }

    if (dialogueFullText) {
      revealFullDialogue();
      return;
    }

    if (dialogue.scrollHeight > dialogue.clientHeight) {
      dialogue.scrollTop = dialogue.scrollHeight;
    }
  });
}

renderQuestions();renderStats();say("start");updateProgress();formArea.scrollTop=0;