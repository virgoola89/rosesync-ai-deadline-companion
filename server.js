const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'data', 'db.json');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-6-luna';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const roses = [
  { id:'purple', name:'Purple Rose', color:'Purple', hex:'#8B5CF6', philosophy:'Imagination & Transformation', meaning:'For goals that represent reinvention, bold ideas, creativity, and becoming a new version of yourself.', affirmation:'I am growing into what I imagined.' },
  { id:'white', name:'White Rose', color:'White', hex:'#F8F6F1', philosophy:'Clarity & New Beginnings', meaning:'For projects that need calm focus, a clean start, disciplined thinking, and intentional progress.', affirmation:'I move forward with clarity.' },
  { id:'yellow', name:'Yellow Rose', color:'Yellow', hex:'#F5C84C', philosophy:'Optimism & Creative Energy', meaning:'For joyful goals, learning journeys, collaborative projects, and work that needs bright momentum.', affirmation:'I grow with curiosity and joy.' },
  { id:'red', name:'Red Rose', color:'Red', hex:'#C92A42', philosophy:'Passion & Determination', meaning:'For ambitious deadlines that demand courage, commitment, persistence, and decisive action.', affirmation:'I show up with purpose and courage.' },
  { id:'pink', name:'Pink Rose', color:'Pink', hex:'#E88FAB', philosophy:'Growth & Self-Development', meaning:'For personal growth, skill-building, thoughtful progress, and goals you want to nurture consistently.', affirmation:'Small steps become a beautiful bloom.' }
];

const deadlineTypes = [
  { id:'2-weeks', label:'2 Weeks', days:14, description:'A focused sprint for short projects and quick deliverables.' },
  { id:'1-month', label:'1 Month', days:30, description:'A balanced timeline for a meaningful short-term goal.' },
  { id:'3-months', label:'3 Months', days:90, description:'Ideal for learning goals, portfolio projects, or larger builds.' },
  { id:'6-months', label:'6 Months', days:180, description:'For deeper projects that need multiple milestones and iteration.' },
  { id:'1-year', label:'1 Year', days:365, description:'A long-growth journey for major personal or professional goals.' },
  { id:'custom', label:'Custom Date', days:null, description:'Choose your own target date.' }
];

function readDb() {
  if (!fs.existsSync(DB_PATH)) return { projects: [] };
  const parsed = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  if (!Array.isArray(parsed.projects)) parsed.projects = [];
  return parsed;
}

function writeDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function getRose(id) { return roses.find((rose) => rose.id === id); }
function getDeadlineType(id) { return deadlineTypes.find((type) => type.id === id); }

function dateOnlyUTC(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function toDateString(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(start, days) {
  const date = new Date(start.getTime());
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

function parseDateOnly(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysBetween(start, end) {
  return Math.max(0, Math.ceil((end - start) / 86400000));
}

function resolveDeadline(deadlineTypeId, customDeadline) {
  const type = getDeadlineType(deadlineTypeId);
  if (!type) throw new Error('Invalid deadline type.');
  const today = dateOnlyUTC();

  if (type.id === 'custom') {
    const target = parseDateOnly(customDeadline);
    if (!target || target < today) throw new Error('Custom deadline must be today or a future date.');
    return { deadline: toDateString(target), totalDays: Math.max(1, daysBetween(today, target)), type };
  }

  const target = addDays(today, type.days);
  return { deadline: toDateString(target), totalDays: type.days, type };
}

function createGrowthPlan(totalDays) {
  const safeDays = Math.max(1, totalDays);
  const boundaries = [0, .12, .32, .55, .76, .92, 1].map(v => Math.max(1, Math.round(safeDays * v)));
  return [
    { stage:'Seed', startDay:1, endDay:Math.max(1, boundaries[1]) },
    { stage:'Sprout', startDay:Math.max(2, boundaries[1] + 1), endDay:Math.max(2, boundaries[2]) },
    { stage:'Young Plant', startDay:Math.max(3, boundaries[2] + 1), endDay:Math.max(3, boundaries[3]) },
    { stage:'Bud Formation', startDay:Math.max(4, boundaries[3] + 1), endDay:Math.max(4, boundaries[4]) },
    { stage:'Opening Bloom', startDay:Math.max(5, boundaries[4] + 1), endDay:Math.max(5, boundaries[5]) },
    { stage:'Full Bloom', startDay:Math.max(1, boundaries[5] + 1), endDay:safeDays }
  ];
}

function normalizeRoughPlan(value) {
  if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean).slice(0, 8);
  return String(value || '')
    .split(/\n|→|->|,/)
    .map(v => v.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function createOrganizerPlan({ title, goal, roughPlan, context }) {
  const steps = normalizeRoughPlan(roughPlan);
  return {
    title: 'My Bloom Plan',
    project: title.trim(),
    goal: goal.trim(),
    bigPicture: steps,
    context: String(context || '').trim(),
    aiStatus: 'ready-for-ai-refinement',
    aiSuggestionSlots: {
      milestoneSuggestions: [],
      nextStepSuggestions: [],
      risksToConsider: [],
      references: []
    }
  };
}


function createMomentumState() {
  return {
    philosophy: 'AI is a goal partner: it helps the user regain clarity, refresh ideas, and keep moving without taking ownership of the goal away from them.',
    status: 'steady',
    userEnergy: null,
    stagnationDays: 0,
    lastCompletedTaskAt: null,
    lastCheckInAt: null,
    suggestedNextStep: null,
    ideaRefresh: null,
    aiNudges: [],
    boostHistory: []
  };
}

function deriveMomentum(project) {
  const now = new Date();
  const state = project.momentum || createMomentumState();
  const tasks = Array.isArray(project.tasks) ? project.tasks : [];
  const pending = tasks.filter(task => !task.completed);
  const progress = calculateProgress(project);

  let stagnationDays = Number(state.stagnationDays || 0);
  if (state.lastCompletedTaskAt) {
    const last = new Date(state.lastCompletedTaskAt);
    if (!Number.isNaN(last.getTime())) {
      stagnationDays = Math.max(0, Math.floor((now - last) / 86400000));
    }
  }

  let status = 'steady';
  if (stagnationDays >= 4 || progress.taskProgress + 25 < progress.timeProgress) status = 'stuck';
  else if (stagnationDays >= 2 || progress.taskProgress + 12 < progress.timeProgress) status = 'needs-boost';
  else if (state.userEnergy === 'tired') status = 'light-mode';
  else if (state.userEnergy === 'inspired') status = 'momentum-high';

  return {
    ...state,
    status,
    stagnationDays,
    pendingTaskCount: pending.length,
    progress
  };
}

function buildBloomBoost(project, mode = 'auto') {
  const momentum = deriveMomentum(project);
  const pending = (project.tasks || []).filter(task => !task.completed);
  const firstPending = pending[0];
  const roughSteps = project.organizer?.bigPicture || [];
  const fallbackStep = roughSteps[0] || 'Choose one small action that moves your project forward.';

  const nextStep = firstPending?.title || firstPending?.text || fallbackStep;
  const energy = momentum.userEnergy;

  let headline = 'Keep growing, one meaningful step at a time.';
  let message = 'Your goal does not need a perfect day. It needs one clear next step.';
  let suggestion = nextStep;

  if (mode === 'refresh-idea') {
    headline = 'Fresh angle, same goal.';
    message = 'Try changing the approach without changing the outcome. Reuse what already works, simplify the format, or test a smaller version first.';
    suggestion = `Reframe this step: ${nextStep}`;
  } else if (mode === 'simplify' || energy === 'tired') {
    headline = 'Make today lighter.';
    message = 'Reduce the next task until it feels easy enough to start. Progress can be small and still count.';
    suggestion = `Do only the smallest useful part of: ${nextStep}`;
  } else if (mode === 'motivate' || momentum.status === 'needs-boost') {
    headline = 'You still have momentum.';
    message = 'A slower day is not a failed day. Reconnect with the reason you set this goal, then complete one visible win.';
  } else if (momentum.status === 'stuck') {
    headline = 'Let’s restart with clarity.';
    message = 'Instead of trying to catch up on everything, choose one task that reduces uncertainty or unlocks the next milestone.';
  } else if (energy === 'inspired') {
    headline = 'Use the momentum while it is here.';
    message = 'You have room for a stretch task today. Pick one action that creates leverage for tomorrow.';
  }

  return {
    id: crypto.randomUUID(),
    mode,
    headline,
    message,
    suggestedNextStep: suggestion,
    actions: ['add-to-today', 'show-another-idea', 'simplify-next-step'],
    generatedAt: new Date().toISOString(),
    principle: 'AI supports the journey; the user owns the goal.'
  };
}


function buildDailyTodo(project) {
  const tasks = Array.isArray(project.tasks) ? project.tasks.filter(task => !task.completed) : [];
  if (tasks.length) return tasks.slice(0,3).map(task => ({ id:task.id, title:task.title, completed:false }));
  const rough = project.organizer?.bigPicture || [];
  const base = rough.length ? rough : ['Clarify the next milestone', 'Create one tangible output', 'Review progress and adjust'];
  return base.slice(0,3).map((title, index) => ({
    id: `demo-${index+1}`,
    title,
    completed: index === 0 && project.progress?.taskProgress > 0
  }));
}

function getGrowthStage(project, progressOverride) {
  const progress = progressOverride ?? calculateProgress(project).bloomProgress;
  if (progress >= 92) return 'Full Bloom';
  if (progress >= 76) return 'Opening Bloom';
  if (progress >= 55) return 'Bud Formation';
  if (progress >= 32) return 'Young Plant';
  if (progress >= 12) return 'Sprout';
  return 'Seed';
}

function weatherTheme(kind='sunny') {
  const themes = {
    sunny:{kind:'sunny',label:'Sunny',icon:'☀️',message:'Warm light, clear momentum',palette:['#f7d9c8','#fff1cf','#d8e7c9']},
    cloudy:{kind:'cloudy',label:'Cloudy',icon:'☁️',message:'Soft focus, calm pace',palette:['#dfe4e8','#ebe5df','#cdd9cf']},
    rainy:{kind:'rainy',label:'Rainy',icon:'🌧️',message:'Gentle rain, reflective rhythm',palette:['#b7cad7','#d8dce5','#b8c9bc']},
    night:{kind:'night',label:'Night',icon:'🌙',message:'Quiet focus, deep work',palette:['#2f3558','#575579','#9a7895']}
  };
  return themes[kind] || themes.sunny;
}


function stripCodeFences(text='') {
  return String(text).trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
}

async function callOpenAIJson({ instructions, input }) {
  if (!OPENAI_API_KEY) return null;
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      instructions,
      input,
      max_output_tokens: 1400
    })
  });

  const payload = await response.json();
  if (!response.ok) {
    const message = payload?.error?.message || `OpenAI request failed (${response.status}).`;
    throw new Error(message);
  }

  const text = payload.output_text || '';
  try {
    return JSON.parse(stripCodeFences(text));
  } catch {
    throw new Error('AI returned an unexpected format. Please try again.');
  }
}

function fallbackPlanner(project) {
  const rough = project.organizer?.bigPicture || [];
  const base = rough.length ? rough : ['Clarify the outcome', 'Build the first version', 'Review and improve', 'Prepare final delivery'];
  const milestoneSuggestions = base.slice(0, 5).map((title, index) => ({
    id: crypto.randomUUID(),
    title,
    why: index === 0 ? 'Start with clarity so the rest of the journey stays focused.' : 'Turn the big goal into a visible checkpoint.',
    status: 'suggested'
  }));
  return {
    summary: 'A lightweight plan based on your project goal and rough outline.',
    milestoneSuggestions,
    nextStepSuggestions: [`Start with: ${base[0]}`, 'Define what “done” looks like for the next milestone.'],
    risksToConsider: ['Trying to perfect too much too early', 'Leaving final review too close to the deadline'],
    referenceSuggestions: [
      { type:'Search topic', label:`Best practices for ${project.title}` },
      { type:'Reference type', label:'Official documentation, examples, and high-quality case studies related to the project' }
    ],
    source: 'fallback'
  };
}

async function generateAiPlan(project) {
  const fallback = fallbackPlanner(project);
  if (!OPENAI_API_KEY) return fallback;

  const context = {
    project: project.title,
    goal: project.goal,
    deadline: project.deadline,
    totalDays: project.totalDays,
    rosePhilosophy: project.rose?.philosophy,
    roughPlan: project.organizer?.bigPicture || [],
    userContext: project.organizer?.context || ''
  };

  const data = await callOpenAIJson({
    instructions: `You are RoseSync, a concise planning partner. Help the user shape a realistic journey without taking ownership of the goal away from them. Return ONLY valid JSON with these keys: summary (string), milestoneSuggestions (array of 3-5 objects with title and why), nextStepSuggestions (array of 2-3 strings), risksToConsider (array of 2-3 strings), referenceSuggestions (array of 2-4 objects with type and label). References must be safe suggestions for what to look up; do not invent URLs or claim you verified a source. Keep ideas high-level, practical, encouraging, and non-patronizing.`,
    input: JSON.stringify(context)
  });

  return {
    summary: String(data.summary || fallback.summary),
    milestoneSuggestions: Array.isArray(data.milestoneSuggestions) ? data.milestoneSuggestions.slice(0,5).map(item => ({ id: crypto.randomUUID(), title: String(item.title || '').trim(), why: String(item.why || '').trim(), status:'suggested' })).filter(x => x.title) : fallback.milestoneSuggestions,
    nextStepSuggestions: Array.isArray(data.nextStepSuggestions) ? data.nextStepSuggestions.slice(0,3).map(String) : fallback.nextStepSuggestions,
    risksToConsider: Array.isArray(data.risksToConsider) ? data.risksToConsider.slice(0,3).map(String) : fallback.risksToConsider,
    referenceSuggestions: Array.isArray(data.referenceSuggestions) ? data.referenceSuggestions.slice(0,4).map(item => ({ type:String(item.type || 'Reference'), label:String(item.label || '').trim() })).filter(x => x.label) : fallback.referenceSuggestions,
    source: 'openai',
    model: OPENAI_MODEL
  };
}

async function generateAiBoost(project, mode='auto') {
  const fallback = buildBloomBoost(project, mode);
  if (!OPENAI_API_KEY) return { ...fallback, source:'fallback' };

  const momentum = deriveMomentum(project);
  const pending = (project.tasks || []).filter(task => !task.completed).map(t => t.title).slice(0,6);
  const context = {
    mode,
    project: project.title,
    goal: project.goal,
    deadline: project.deadline,
    daysRemaining: daysBetween(dateOnlyUTC(), parseDateOnly(project.deadline) || dateOnlyUTC()),
    progress: momentum.progress,
    momentumStatus: momentum.status,
    userEnergy: momentum.userEnergy,
    pendingTasks: pending,
    roughPlan: project.organizer?.bigPicture || [],
    lastSuggestion: project.momentum?.suggestedNextStep || null
  };

  const data = await callOpenAIJson({
    instructions: `You are Bloom Boost, RoseSync's momentum coach. The user may be focused, tired, inspired, or stuck. Be warm, practical, concise, and never guilt the user. Do not diagnose emotions. Help them regain momentum while preserving their ownership of the goal. Return ONLY valid JSON with keys: headline, message, suggestedNextStep. The next step must be concrete and small. Avoid generic motivational quotes and avoid repeating the last suggestion when possible.`,
    input: JSON.stringify(context)
  });

  return {
    ...fallback,
    headline: String(data.headline || fallback.headline),
    message: String(data.message || fallback.message),
    suggestedNextStep: String(data.suggestedNextStep || fallback.suggestedNextStep),
    source:'openai',
    model: OPENAI_MODEL
  };
}

function mapWeatherCode(code, isDay=1) {
  if (!isDay) return 'night';
  if ([0,1].includes(code)) return 'sunny';
  if ([2,3,45,48].includes(code)) return 'cloudy';
  if ([51,53,55,56,57,61,63,65,66,67,71,73,75,77,80,81,82,85,86,95,96,99].includes(code)) return 'rainy';
  return 'cloudy';
}

async function getLiveWeather(latitude, longitude) {
  const lat = Number(latitude);
  const lon = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    throw new Error('Valid latitude and longitude are required.');
  }
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: 'temperature_2m,apparent_temperature,precipitation,weather_code,cloud_cover,wind_speed_10m,is_day',
    timezone: 'auto'
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  const payload = await response.json();
  if (!response.ok || !payload.current) throw new Error('Weather service is unavailable right now.');
  const kind = mapWeatherCode(Number(payload.current.weather_code), Number(payload.current.is_day));
  return {
    provider:'Open-Meteo',
    kind,
    theme: weatherTheme(kind),
    temperature: payload.current.temperature_2m,
    apparentTemperature: payload.current.apparent_temperature,
    precipitation: payload.current.precipitation,
    cloudCover: payload.current.cloud_cover,
    windSpeed: payload.current.wind_speed_10m,
    weatherCode: payload.current.weather_code,
    isDay: Boolean(payload.current.is_day),
    timezone: payload.timezone,
    updatedAt: new Date().toISOString()
  };
}

function calculateProgress(project) {
  const today = dateOnlyUTC();
  const created = parseDateOnly(project.startDate) || today;
  const deadline = parseDateOnly(project.deadline) || today;
  const total = Math.max(1, project.totalDays || daysBetween(created, deadline));
  const elapsed = Math.min(total, Math.max(0, daysBetween(created, today)));
  const timeProgress = Math.round((elapsed / total) * 100);

  const allTasks = Array.isArray(project.tasks) ? project.tasks : [];
  const completedTasks = allTasks.filter(task => task.completed).length;
  const taskProgress = allTasks.length ? Math.round((completedTasks / allTasks.length) * 100) : 0;
  const bloomProgress = allTasks.length ? Math.round((timeProgress + taskProgress) / 2) : timeProgress;

  return { timeProgress, taskProgress, bloomProgress, completedTasks, totalTasks: allTasks.length };
}

app.get('/api/health', (_req, res) => res.json({ ok:true, app:'RoseSync', version:'1.5.0-ai-weather', aiConfigured:Boolean(OPENAI_API_KEY), weatherProvider:'Open-Meteo' }));
app.get('/api/roses', (_req, res) => res.json({ roses }));
app.get('/api/deadline-types', (_req, res) => res.json({ deadlineTypes }));

app.post('/api/projects', (req, res) => {
  const { title, goal, roseId, deadlineType, customDeadline, roughPlan, context } = req.body;
  if (!title || !goal || !roseId || !deadlineType) {
    return res.status(400).json({ error:'title, goal, roseId, and deadlineType are required.' });
  }

  const rose = getRose(roseId);
  if (!rose) return res.status(400).json({ error:'Invalid rose selection.' });

  let resolved;
  try {
    resolved = resolveDeadline(deadlineType, customDeadline);
  } catch (error) {
    return res.status(400).json({ error:error.message });
  }

  const startDate = toDateString(dateOnlyUTC());
  const project = {
    id: crypto.randomUUID(),
    title: title.trim(),
    goal: goal.trim(),
    roseId,
    rose,
    deadlineType: resolved.type.id,
    deadlineTypeLabel: resolved.type.label,
    startDate,
    deadline: resolved.deadline,
    totalDays: resolved.totalDays,
    createdAt: new Date().toISOString(),
    growthPlan: createGrowthPlan(resolved.totalDays),
    organizer: createOrganizerPlan({ title, goal, roughPlan, context }),
    tasks: [],
    dailyTodo: [],
    weather: { status:'pending-integration', provider:null, lastUpdated:null },
    aiPlanner: { status:'not-connected', provider:null, lastGeneratedAt:null },
    momentum: createMomentumState()
  };
  project.progress = calculateProgress(project);

  const db = readDb();
  db.projects.push(project);
  writeDb(db);
  res.status(201).json({ project });
});

app.get('/api/projects/:id', (req, res) => {
  const db = readDb();
  const project = db.projects.find((item) => item.id === req.params.id);
  if (!project) return res.status(404).json({ error:'Project not found.' });
  project.progress = calculateProgress(project);
  res.json({ project });
});

app.get('/api/projects/:id/progress', (req, res) => {
  const db = readDb();
  const project = db.projects.find((item) => item.id === req.params.id);
  if (!project) return res.status(404).json({ error:'Project not found.' });
  res.json({ progress: calculateProgress(project) });
});




app.post('/api/projects/:id/ai-plan', async (req, res) => {
  const db = readDb();
  const project = db.projects.find((item) => item.id === req.params.id);
  if (!project) return res.status(404).json({ error:'Project not found.' });
  try {
    const plan = await generateAiPlan(project);
    project.organizer.aiSuggestionSlots = {
      milestoneSuggestions: plan.milestoneSuggestions,
      nextStepSuggestions: plan.nextStepSuggestions,
      risksToConsider: plan.risksToConsider,
      references: plan.referenceSuggestions
    };
    project.aiPlanner = { status: plan.source === 'openai' ? 'connected' : 'fallback', provider: plan.source === 'openai' ? 'OpenAI' : null, model: plan.model || null, lastGeneratedAt:new Date().toISOString() };
    writeDb(db);
    res.json({ plan, aiConfigured:Boolean(OPENAI_API_KEY) });
  } catch (error) {
    res.status(502).json({ error:error.message });
  }
});

app.post('/api/projects/:id/ai-plan/milestones/:milestoneId', (req, res) => {
  const action = req.body?.action;
  if (!['add','skip'].includes(action)) return res.status(400).json({ error:'action must be add or skip.' });
  const db = readDb();
  const project = db.projects.find((item) => item.id === req.params.id);
  if (!project) return res.status(404).json({ error:'Project not found.' });
  const milestones = project.organizer?.aiSuggestionSlots?.milestoneSuggestions || [];
  const milestone = milestones.find(m => m.id === req.params.milestoneId);
  if (!milestone) return res.status(404).json({ error:'Milestone suggestion not found.' });
  milestone.status = action === 'add' ? 'accepted' : 'skipped';
  if (action === 'add' && !(project.tasks || []).some(t => t.sourceMilestoneId === milestone.id)) {
    project.tasks.push({ id:crypto.randomUUID(), title: milestone.title, dueDate:null, completed:false, createdAt:new Date().toISOString(), completedAt:null, sourceMilestoneId:milestone.id });
  }
  project.progress = calculateProgress(project);
  writeDb(db);
  res.json({ milestone, tasks:project.tasks, progress:project.progress });
});

app.post('/api/weather', async (req, res) => {
  try {
    const weather = await getLiveWeather(req.body?.latitude, req.body?.longitude);
    res.json({ weather });
  } catch (error) {
    res.status(400).json({ error:error.message });
  }
});

app.post('/api/projects/:id/live-weather', async (req, res) => {
  const db = readDb();
  const project = db.projects.find((item) => item.id === req.params.id);
  if (!project) return res.status(404).json({ error:'Project not found.' });
  try {
    const weather = await getLiveWeather(req.body?.latitude, req.body?.longitude);
    project.weather = { status:'connected', provider:weather.provider, lastUpdated:weather.updatedAt, latest:weather };
    writeDb(db);
    res.json({ weather });
  } catch (error) {
    res.status(400).json({ error:error.message });
  }
});

app.post('/api/projects/:id/tasks', (req, res) => {
  const { title, dueDate } = req.body || {};
  if (!String(title || '').trim()) return res.status(400).json({ error:'title is required.' });

  const db = readDb();
  const project = db.projects.find((item) => item.id === req.params.id);
  if (!project) return res.status(404).json({ error:'Project not found.' });

  const task = {
    id: crypto.randomUUID(),
    title: String(title).trim(),
    dueDate: dueDate || null,
    completed: false,
    createdAt: new Date().toISOString(),
    completedAt: null
  };
  project.tasks = Array.isArray(project.tasks) ? project.tasks : [];
  project.tasks.push(task);
  project.progress = calculateProgress(project);
  writeDb(db);
  res.status(201).json({ task, progress: project.progress });
});

app.patch('/api/projects/:id/tasks/:taskId', (req, res) => {
  const db = readDb();
  const project = db.projects.find((item) => item.id === req.params.id);
  if (!project) return res.status(404).json({ error:'Project not found.' });

  const task = (project.tasks || []).find((item) => item.id === req.params.taskId);
  if (!task) return res.status(404).json({ error:'Task not found.' });

  if (typeof req.body?.title === 'string' && req.body.title.trim()) task.title = req.body.title.trim();
  if ('dueDate' in (req.body || {})) task.dueDate = req.body.dueDate || null;
  if (typeof req.body?.completed === 'boolean') {
    task.completed = req.body.completed;
    task.completedAt = req.body.completed ? new Date().toISOString() : null;
    project.momentum = project.momentum || createMomentumState();
    if (req.body.completed) {
      project.momentum.lastCompletedTaskAt = task.completedAt;
      project.momentum.stagnationDays = 0;
      project.momentum.status = 'steady';
    }
  }

  project.progress = calculateProgress(project);
  writeDb(db);
  res.json({ task, progress: project.progress, momentum: deriveMomentum(project) });
});

app.post('/api/projects/:id/check-in', (req, res) => {
  const allowed = ['focused', 'stuck', 'tired', 'inspired'];
  const { energy } = req.body || {};
  if (!allowed.includes(energy)) {
    return res.status(400).json({ error:'energy must be one of: focused, stuck, tired, inspired.' });
  }

  const db = readDb();
  const project = db.projects.find((item) => item.id === req.params.id);
  if (!project) return res.status(404).json({ error:'Project not found.' });

  project.momentum = project.momentum || createMomentumState();
  project.momentum.userEnergy = energy;
  project.momentum.lastCheckInAt = new Date().toISOString();
  if (energy === 'stuck') project.momentum.status = 'needs-boost';
  writeDb(db);

  res.json({ momentum: deriveMomentum(project) });
});

app.get('/api/projects/:id/momentum', (req, res) => {
  const db = readDb();
  const project = db.projects.find((item) => item.id === req.params.id);
  if (!project) return res.status(404).json({ error:'Project not found.' });
  res.json({ momentum: deriveMomentum(project) });
});

app.post('/api/projects/:id/bloom-boost', async (req, res) => {
  const allowedModes = ['auto', 'refresh-idea', 'simplify', 'motivate'];
  const mode = req.body?.mode || 'auto';
  if (!allowedModes.includes(mode)) {
    return res.status(400).json({ error:'mode must be one of: auto, refresh-idea, simplify, motivate.' });
  }

  const db = readDb();
  const project = db.projects.find((item) => item.id === req.params.id);
  if (!project) return res.status(404).json({ error:'Project not found.' });

  project.momentum = project.momentum || createMomentumState();
  let boost;
  try { boost = await generateAiBoost(project, mode); } catch (error) { boost = { ...buildBloomBoost(project, mode), source:'fallback', warning:error.message }; }
  project.momentum.suggestedNextStep = boost.suggestedNextStep;
  if (mode === 'refresh-idea') project.momentum.ideaRefresh = boost.message;
  project.momentum.aiNudges = [...(project.momentum.aiNudges || []), boost].slice(-20);
  project.momentum.boostHistory = [...(project.momentum.boostHistory || []), {
    id: boost.id,
    mode: boost.mode,
    generatedAt: boost.generatedAt
  }].slice(-50);
  writeDb(db);

  res.json({ boost, momentum: deriveMomentum(project) });
});


app.get('/api/projects/:id/demo-dashboard', (req, res) => {
  const db = readDb();
  const project = db.projects.find((item) => item.id === req.params.id);
  if (!project) return res.status(404).json({ error:'Project not found.' });
  project.progress = calculateProgress(project);
  const weather = weatherTheme(String(req.query.weather || 'sunny').toLowerCase());
  const requestedDemoProgress = Number(req.query.demoProgress);
  const hasDemoProgress = Number.isFinite(requestedDemoProgress) && requestedDemoProgress >= 0 && requestedDemoProgress <= 100;
  const demoBloomProgress = hasDemoProgress ? Math.round(requestedDemoProgress) : project.progress.bloomProgress;
  const dashboardProgress = hasDemoProgress
    ? {
        ...project.progress,
        timeProgress: Math.min(100, Math.max(0, Math.round(demoBloomProgress * 0.9))),
        taskProgress: Math.min(100, Math.max(0, Math.round(demoBloomProgress * 1.05))),
        bloomProgress: demoBloomProgress
      }
    : project.progress;
  res.json({
    dashboard:{
      projectId: project.id,
      title: project.title,
      goal: project.goal,
      rose: project.rose,
      deadline: project.deadline,
      totalDays: project.totalDays,
      progress: dashboardProgress,
      growthStage: getGrowthStage(project, demoBloomProgress),
      weather,
      dailyTodo: buildDailyTodo(project),
      momentum: deriveMomentum(project),
      lockScreenMessage: demoBloomProgress >= 92 ? 'Today is your bloom day.' : demoBloomProgress >= 55 ? 'Your next milestone is taking shape.' : 'One meaningful step closer to bloom.'
    }
  });
});

app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.listen(PORT, () => console.log(`RoseSync running on http://localhost:${PORT}`));
