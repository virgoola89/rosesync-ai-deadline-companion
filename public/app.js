let selectedRose = null;
let selectedDeadlineType = null;
let deadlineTypes = [];
let currentProject = null;
let currentWeather = 'sunny';
let liveWeather = null;
let presentationProgress = null;

const $ = (id) => document.getElementById(id);
const roseGrid = $('roseGrid');
const deadlineGrid = $('deadlineGrid');
const deadlineStep = $('deadlineStep');
const planStep = $('planStep');
const customWrap = $('customDeadlineWrap');
const customInput = $('customDeadline');
const form = $('projectForm');
const summary = $('selectedRoseSummary');
const durationSummary = $('selectedDurationSummary');
const calculatedDeadline = $('calculatedDeadline');
const note = $('formNote');

function isoDate(date) { return date.toISOString().slice(0, 10); }
function prettyDate(value) { return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }); }
function addDays(days) { const d = new Date(); d.setHours(12,0,0,0); d.setDate(d.getDate()+days); return isoDate(d); }
function daysLeft(deadline) { const now=new Date(); now.setHours(0,0,0,0); const target=new Date(`${deadline}T00:00:00`); return Math.max(0,Math.ceil((target-now)/86400000)); }
function stageEmoji(stage) { return ({'Seed':'🌰','Sprout':'🌱','Young Plant':'🌿','Bud Formation':'🥀','Opening Bloom':'🌷','Full Bloom':'🌹'})[stage] || '🌱'; }


function escapeHtml(value='') { return String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[ch])); }

function renderAiPlan(plan, aiConfigured){
  const root=$('aiPlanResults');
  root.hidden=false;
  const sourceLabel=plan.source==='openai' ? `Live AI${plan.model?` • ${plan.model}`:''}` : 'Smart fallback demo';
  $('aiPlanStatus').textContent=`${sourceLabel} — suggestions are optional; you remain in control.`;
  root.innerHTML=`<div class="ai-plan-summary"><strong>Journey summary</strong><p>${escapeHtml(plan.summary)}</p></div>
    <div><strong>Suggested milestones</strong><div class="suggestion-grid">${(plan.milestoneSuggestions||[]).map(m=>`<div class="suggestion-card" data-mid="${m.id}"><strong>${escapeHtml(m.title)}</strong><p>${escapeHtml(m.why)}</p><div class="suggestion-actions"><button data-action="add">Add to plan</button><button data-action="skip">Skip</button></div></div>`).join('')}</div></div>
    <div class="ai-mini-columns"><div class="ai-mini-box"><h4>Next-step ideas</h4><ul>${(plan.nextStepSuggestions||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul></div><div class="ai-mini-box"><h4>Risks to watch</h4><ul>${(plan.risksToConsider||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul></div></div>
    <div class="ai-mini-box"><h4>Reference directions</h4><ul>${(plan.referenceSuggestions||[]).map(x=>`<li><b>${escapeHtml(x.type)}:</b> ${escapeHtml(x.label)}</li>`).join('')}</ul></div>`;
  root.querySelectorAll('.suggestion-card button').forEach(btn=>btn.onclick=async()=>{
    const card=btn.closest('.suggestion-card'); const milestoneId=card.dataset.mid; const action=btn.dataset.action;
    btn.disabled=true;
    const res=await fetch(`/api/projects/${currentProject.id}/ai-plan/milestones/${milestoneId}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action})});
    const data=await res.json();
    if(!res.ok){ btn.disabled=false; return $('aiPlanStatus').textContent=data.error||'Could not update the plan.'; }
    card.classList.add(action==='add'?'accepted':'skipped'); card.querySelector('.suggestion-actions').innerHTML=action==='add'?'✓ Added to your plan':'Skipped';
    await renderDashboard(currentWeather);
  });
}

async function requestAiPlan(){
  if(!currentProject) return;
  const btn=$('aiPlanBtn'); btn.disabled=true; btn.textContent='✨ Shaping your journey…'; $('aiPlanStatus').textContent='Reading your goal, rough plan, deadline, and project context…';
  try{
    const res=await fetch(`/api/projects/${currentProject.id}/ai-plan`,{method:'POST'}); const data=await res.json();
    if(!res.ok) throw new Error(data.error||'AI planner is unavailable.');
    renderAiPlan(data.plan,data.aiConfigured);
  }catch(error){ $('aiPlanStatus').textContent=error.message; }
  finally{ btn.disabled=false; btn.textContent='✨ Let AI Shape My Journey'; }
}

function requestLiveWeather(){
  if(!currentProject) return;
  const status=$('weatherStatus');
  if(!navigator.geolocation) return status.textContent='Geolocation is not supported by this browser.';
  status.textContent='Requesting location permission for local weather…';
  navigator.geolocation.getCurrentPosition(async pos=>{
    try{
      const res=await fetch(`/api/projects/${currentProject.id}/live-weather`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({latitude:pos.coords.latitude,longitude:pos.coords.longitude})});
      const data=await res.json(); if(!res.ok) throw new Error(data.error||'Weather unavailable.');
      liveWeather=data.weather; currentWeather=liveWeather.kind; await renderDashboard(currentWeather);
      const w=liveWeather.theme; $('weatherPill').textContent=`${w.icon} ${Math.round(liveWeather.temperature)}°C • ${w.label}`;
      status.textContent=`Live weather connected • ${Math.round(liveWeather.temperature)}°C • ${liveWeather.timezone}`;
    }catch(error){ status.textContent=error.message; }
  }, err=>{ status.textContent=err.code===1?'Location permission was not granted. Demo weather is still available.':'Could not read your location. Demo weather is still available.'; }, {enableHighAccuracy:false,timeout:10000,maximumAge:600000});
}

function updateDeadlineSummary(){
  if(!selectedDeadlineType) return;
  const dateText = selectedDeadlineType.id==='custom'
    ? (customInput.value ? `Target: ${prettyDate(customInput.value)}` : 'Choose your target date')
    : `Target: ${prettyDate(addDays(selectedDeadlineType.days))}`;
  durationSummary.querySelector('strong').textContent=selectedDeadlineType.label;
  calculatedDeadline.textContent=dateText;
}

async function loadRoses(){
  const data=await (await fetch('/api/roses')).json();
  roseGrid.innerHTML=data.roses.map(rose=>`<button class="rose-card" type="button" data-id="${rose.id}" style="--accent:${rose.hex}"><div class="rose-visual"><span style="filter:${rose.id==='white'?'grayscale(1) brightness(1.8)':rose.id==='yellow'?'sepia(1) saturate(4) hue-rotate(355deg)':rose.id==='purple'?'hue-rotate(240deg) saturate(1.4)':rose.id==='pink'?'hue-rotate(320deg) saturate(.7) brightness(1.15)':''}">🌹</span></div><h3>${rose.name}</h3><p class="philosophy">${rose.philosophy}</p><p class="meaning">${rose.meaning}</p><p class="affirmation">“${rose.affirmation}”</p></button>`).join('');
  document.querySelectorAll('.rose-card').forEach(card=>card.onclick=()=>{
    document.querySelectorAll('.rose-card').forEach(c=>c.classList.remove('selected')); card.classList.add('selected');
    selectedRose=data.roses.find(r=>r.id===card.dataset.id); deadlineStep.classList.add('unlocked');
    summary.querySelector('.swatch').style.background=selectedRose.hex; summary.querySelector('strong').textContent=`${selectedRose.name} — ${selectedRose.philosophy}`;
    deadlineStep.scrollIntoView({behavior:'smooth',block:'center'});
  });
}

async function loadDeadlineTypes(){
  const data=await (await fetch('/api/deadline-types')).json(); deadlineTypes=data.deadlineTypes;
  deadlineGrid.innerHTML=deadlineTypes.map(type=>`<button class="deadline-card" type="button" data-id="${type.id}"><strong>${type.label}</strong><span>${type.description}</span></button>`).join('');
  document.querySelectorAll('.deadline-card').forEach(card=>card.onclick=()=>{
    document.querySelectorAll('.deadline-card').forEach(c=>c.classList.remove('selected')); card.classList.add('selected');
    selectedDeadlineType=deadlineTypes.find(t=>t.id===card.dataset.id); customWrap.hidden=selectedDeadlineType.id!=='custom'; planStep.classList.add('unlocked'); updateDeadlineSummary();
    planStep.scrollIntoView({behavior:'smooth',block:'start'});
  });
}
customInput.min=isoDate(new Date()); customInput.onchange=updateDeadlineSummary;

async function renderDashboard(weather=currentWeather){
  if(!currentProject) return;
  currentWeather=weather;
  const demoParam = presentationProgress === null ? '' : `&demoProgress=${presentationProgress}`;
  const data=await (await fetch(`/api/projects/${currentProject.id}/demo-dashboard?weather=${weather}${demoParam}`)).json();
  const d=data.dashboard;
  $('phonePreview').className=`preview-phone ${d.weather.kind}`;
  $('weatherPill').textContent=liveWeather && liveWeather.kind===weather ? `${d.weather.icon} ${Math.round(liveWeather.temperature)}°C • ${d.weather.label}` : `${d.weather.icon} ${d.weather.label}`;
  $('roseStage').textContent=stageEmoji(d.growthStage); $('stageLabel').textContent=d.growthStage;
  $('previewTitle').textContent=d.title; $('previewCountdown').textContent=`${daysLeft(d.deadline)} days left`;
  $('timeProgress').textContent=`${d.progress.timeProgress}%`; $('taskProgress').textContent=`${d.progress.taskProgress}%`; $('bloomProgress').textContent=`${d.progress.bloomProgress}%`;
  $('todoList').innerHTML=d.dailyTodo.map((t,i)=>`<label class="todo-item"><input type="checkbox" ${t.completed?'checked':''} disabled><span>${t.title}</span></label>`).join('');
  $('lockMessage').textContent=d.lockScreenMessage;
  $('lockDate').textContent=new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'}).toUpperCase();
  document.querySelectorAll('.weather-buttons button').forEach(b=>b.classList.toggle('selected',b.dataset.weather===weather));
}

document.querySelectorAll('.weather-buttons button').forEach(btn=>btn.onclick=()=>renderDashboard(btn.dataset.weather));
document.querySelectorAll('.energy-buttons button').forEach(btn=>btn.onclick=async()=>{
  if(!currentProject) return;
  document.querySelectorAll('.energy-buttons button').forEach(b=>b.classList.remove('selected')); btn.classList.add('selected');
  await fetch(`/api/projects/${currentProject.id}/check-in`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({energy:btn.dataset.energy})});
  const boost=await (await fetch(`/api/projects/${currentProject.id}/bloom-boost`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'auto'})})).json();
  showBoost(boost.boost);
});

function showBoost(boost){
  $('boostCard').innerHTML=`<span class="boost-icon">✨</span><div><strong>${boost.headline}</strong><p>${boost.message}</p><div class="boost-next"><small>Suggested next step</small><b>${boost.suggestedNextStep}</b></div><div class="boost-actions"><button class="secondary" data-mode="refresh-idea">Refresh my idea</button><button class="secondary" data-mode="simplify">Simplify next step</button><button class="secondary" data-mode="motivate">Give me a boost</button></div></div>`;
  $('boostCard').querySelectorAll('[data-mode]').forEach(btn=>btn.onclick=async()=>{
    const data=await (await fetch(`/api/projects/${currentProject.id}/bloom-boost`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:btn.dataset.mode})})).json(); showBoost(data.boost);
  });
}

$('aiPlanBtn').onclick=requestAiPlan;
$('liveWeatherBtn').onclick=requestLiveWeather;

$('boostBtn').onclick=async()=>{
  if(!currentProject) return;
  const data=await (await fetch(`/api/projects/${currentProject.id}/bloom-boost`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'auto'})})).json(); showBoost(data.boost);
};

form.onsubmit=async(event)=>{
  event.preventDefault(); note.textContent='';
  if(!selectedRose) return note.textContent='Please choose your rose first.';
  if(!selectedDeadlineType) return note.textContent='Please choose your journey length.';
  if(selectedDeadlineType.id==='custom'&&!customInput.value) return note.textContent='Please choose a custom deadline.';
  const values=Object.fromEntries(new FormData(form).entries());
  const payload={...values,roseId:selectedRose.id,deadlineType:selectedDeadlineType.id,customDeadline:selectedDeadlineType.id==='custom'?customInput.value:null};
  const res=await fetch('/api/projects',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}); const data=await res.json();
  if(!res.ok) return note.textContent=data.error||'Something went wrong.';
  currentProject=data.project; const p=currentProject; $('resultPanel').hidden=false;
  $('resultText').textContent=`${p.rose.name} is now growing toward ${prettyDate(p.deadline)}. RoseSync will adapt the daily view to progress, momentum, and weather.`;
  $('roughPlanPreview').innerHTML=p.organizer.bigPicture.length?p.organizer.bigPicture.map((step,i)=>`<span>${i+1}. ${step}</span>`).join(''):'<span>AI can help shape the first milestones.</span>';
  await renderDashboard('sunny'); $('resultPanel').scrollIntoView({behavior:'smooth'});
};

Promise.all([loadRoses(),loadDeadlineTypes()]);


document.querySelectorAll('.scenario-buttons button').forEach(btn=>btn.onclick=async()=>{
  presentationProgress=Number(btn.dataset.progress);
  document.querySelectorAll('.scenario-buttons button').forEach(b=>b.classList.toggle('active',b===btn));
  await renderDashboard(currentWeather);
});
