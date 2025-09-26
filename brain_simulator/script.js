const regionSequence = [
  'visual',
  'auditory',
  'anterior',
  'amygdala',
  'limbic',
  'hippocampus',
  'motor',
  'prefrontal'
];

const regionMeta = {
  visual: { name: 'Visual Cortex', color: '#38bdf8' },
  auditory: { name: 'Auditory Cortex', color: '#f97316' },
  anterior: { name: 'Anterior Cingulate', color: '#facc15' },
  amygdala: { name: 'Amygdala', color: '#ef4444' },
  limbic: { name: 'Limbic System', color: '#ec4899' },
  hippocampus: { name: 'Hippocampus', color: '#a855f7' },
  motor: { name: 'Motor Cortex', color: '#34d399' },
  prefrontal: { name: 'Prefrontal Cortex', color: '#22d3ee' }
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let timelineSnapshots = [];
let intensityState = {};
let flowSegments = [];
let flowchartFrame = null;
let currentActiveRegion = null;
let previousActiveRegion = null;

const backgroundIdeas = [
  'Ranger Scholar',
  'Temple Archivist',
  'Streetwise Courier',
  'Arcane Naturalist',
  'Clockwork Engineer',
  'Harbor Diplomat',
  'Desert Survivalist',
  'Stormbound Navigator',
  'Battlefield Medic',
  'Court Chronicler'
];

const optionPools = {
  gender: ['female', 'male', 'nonbinary', 'unspecified'],
  outlook: ['optimistic', 'balanced', 'pessimistic'],
  risk: ['cautious', 'balanced', 'bold'],
  emotionStyle: ['steady', 'expressive', 'guarded']
};

const traitLabelMap = {
  openness: 'Openness',
  conscientiousness: 'Conscientiousness',
  extraversion: 'Extraversion',
  agreeableness: 'Agreeableness',
  neuroticism: 'Emotional Reactivity'
};

window.addEventListener('DOMContentLoaded', () => {
  const scenarioInput = document.getElementById('scenarioInput');
  const runButton = document.getElementById('runSimulation');
  const status = document.querySelector('.scenario-panel .status');
  const exportButton = document.getElementById('exportProfile');
  const randomizeButton = document.getElementById('randomizeProfile');

  document.querySelectorAll('input[type="range"]').forEach((input) => {
    updateRangeDisplay(input);
    input.addEventListener('input', (event) => {
      updateRangeDisplay(event.target);
    });
  });

  if (exportButton) {
    exportButton.addEventListener('click', () => {
      const profile = gatherProfile();
      exportProfile(profile);
      status.textContent = 'Profile exported as JSON file for reuse.';
    });
  }

  if (randomizeButton) {
    randomizeButton.addEventListener('click', () => {
      randomizeProfile();
      status.textContent = 'Persona randomized. Adjust sliders or run the simulation.';
    });
  }

  if (scenarioInput) {
    scenarioInput.addEventListener('input', () => {
      status.textContent = '';
    });
  }

  runButton.addEventListener('click', async () => {
    const scenario = scenarioInput.value.trim();
    if (!scenario) {
      status.textContent = 'Describe a situation to ignite the neural conversation.';
      return;
    }

    runButton.disabled = true;
    status.textContent = 'Running multi-region cognition...';
    clearSimulation();

    const profile = gatherProfile();
    const features = analyzeScenario(scenario);
    const context = createContext(profile, features);

    appendStreamEntry('Scenario Ingestion', `Scenario received: “${scenario}”. Preparing sensory parsing.`);

    let previousRegion = null;
    for (let i = 0; i < regionSequence.length; i += 1) {
      const regionId = regionSequence[i];
      setActiveRegion(regionId, previousRegion);
      const result = simulateRegion(regionId, profile, features, context, scenario);
      updateRegionCard(regionId, result.message, result.activity);
      scheduleFlowchart();
      appendStreamEntry(regionMeta[regionId].name, result.streamText || result.message);
      addTimelineEvent(i + 1, regionMeta[regionId].name, result.highlight || result.summary || 'Activity spike', result.activity);
      registerActivity(regionId, result.activity, result.summary || result.highlight || result.message);
      previousRegion = regionId;
      await delay(regionId === 'prefrontal' ? 200 : 650);
    }

    appendStreamEntry('Integrative Summary', createIntegrativeSummary(context));

    const claude = generateClaudeResponse(profile, scenario, features, context);
    document.getElementById('claudeResponse').textContent = claude;
    status.textContent = 'Simulation complete. Compare with the baseline AI voice.';
    runButton.disabled = false;
  });

  drawGraph();
  scheduleFlowchart();
  window.addEventListener('resize', () => {
    drawGraph();
    scheduleFlowchart();
  });
  window.addEventListener('load', scheduleFlowchart);
});

function gatherProfile() {
  const age = Number(document.getElementById('age').value);
  const gender = document.getElementById('gender').value;
  const iq = Number(document.getElementById('iq').value);
  const background = document.getElementById('background').value.trim();

  const bigFive = {};
  document.querySelectorAll('.personality .trait').forEach((trait) => {
    const key = trait.getAttribute('data-trait');
    const value = Number(trait.querySelector('input').value);
    bigFive[key] = value;
  });

  const outlook = document.getElementById('outlook').value;
  const risk = document.getElementById('risk').value;
  const emotionStyle = document.getElementById('emotionStyle').value;

  const ageGroup = deriveAgeGroup(age);

  return {
    age,
    gender,
    iq,
    background,
    bigFive,
    outlook,
    risk,
    emotionStyle,
    ageGroup,
    ageTraits: ageTraitMap[ageGroup]
  };
}

const ageTraitMap = {
  child: { impulsivity: 0.82, wisdom: 0.28, resilience: 0.65, recall: 0.58 },
  teen: { impulsivity: 0.68, wisdom: 0.42, resilience: 0.6, recall: 0.64 },
  adult: { impulsivity: 0.45, wisdom: 0.72, resilience: 0.75, recall: 0.78 },
  elder: { impulsivity: 0.32, wisdom: 0.88, resilience: 0.7, recall: 0.82 }
};

function deriveAgeGroup(age) {
  if (age < 16) return 'child';
  if (age < 23) return 'teen';
  if (age < 58) return 'adult';
  return 'elder';
}

function analyzeScenario(text) {
  const lower = text.toLowerCase();
  const tokens = lower.match(/[a-z']+/g) || [];
  const counts = tokens.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {});

  const score = (keywords) => keywords.reduce((total, word) => total + (counts[word] || 0), 0);

  const features = {
    visual: score(['see', 'saw', 'seen', 'looking', 'glow', 'shadow', 'bright', 'dark', 'figure', 'shape', 'color', 'glimmer', 'approaching', 'vision', 'silhouette']),
    auditory: score(['hear', 'heard', 'listening', 'voice', 'voices', 'shout', 'music', 'whisper', 'echo', 'song', 'crying', 'scream']),
    threat: score(['danger', 'threat', 'threatening', 'weapon', 'knife', 'sword', 'gun', 'growl', 'snarl', 'attack', 'attacking', 'angry', 'hooded', 'blood', 'hostile', 'monster']),
    positive: score(['friendly', 'smile', 'kind', 'helpful', 'gift', 'calm', 'safe', 'relief', 'wagging', 'gentle', 'joy', 'laugh', 'comfort']),
    negative: score(['fear', 'afraid', 'scared', 'terrified', 'worried', 'sad', 'crying', 'despair', 'panic', 'lonely', 'hurt', 'injured']),
    social: score(['crowd', 'people', 'person', 'figure', 'merchant', 'child', 'stranger', 'tavern', 'villager', 'guard', 'friend', 'companion', 'patron']),
    motion: score(['approach', 'approaching', 'running', 'run', 'rushing', 'charging', 'walk', 'walking', 'move', 'moving', 'follow', 'following', 'darting']),
    mystery: score(['mysterious', 'unknown', 'shadowy', 'strange', 'unusual', 'enigmatic', 'secrets', 'hidden', 'hooded', 'cloak', 'dark']),
    memory: score(['remember', 'memory', 'recalled', 'once', 'childhood', 'before', 'nostalgia', 'familiar', 'reminds']),
    objects: score(['door', 'chest', 'box', 'letter', 'map', 'artifact', 'sword', 'torch', 'lantern', 'book', 'coin', 'key'])
  };

  const nature = score(['forest', 'tree', 'river', 'mountain', 'field', 'wind', 'rain', 'storm', 'sun']);
  const urban = score(['street', 'city', 'market', 'tavern', 'alley', 'cobblestone', 'tower', 'castle', 'square', 'inn']);

  const distinctWords = Array.from(new Set(tokens.filter((word) => word.length > 3 && !stopWords.has(word))));

  return {
    ...features,
    length: tokens.length,
    positivity: Math.min(1, features.positive / 3),
    negativity: Math.min(1, (features.threat + features.negative) / 4),
    sensory: Math.min(1, (features.visual + features.auditory) / 4),
    urgency: Math.min(1, (features.motion + features.threat * 1.2) / 4),
    novelty: Math.max(0.1, Math.min(1, 1 - features.memory * 0.18)),
    environment: nature > urban ? 'nature' : urban > 0 ? 'urban' : 'unknown',
    keySubjects: distinctWords.slice(0, 4),
    hasMemoryCue: features.memory > 0,
    tone: Math.max(-1, Math.min(1, Math.min(1, features.positive / 2) - Math.min(1, (features.threat + features.negative) / 3))),
    nature,
    urban
  };
}

const stopWords = new Set([
  'the', 'and', 'with', 'from', 'that', 'there', 'this', 'into', 'while', 'then', 'your', 'their', 'about',
  'toward', 'towards', 'them', 'they', 'have', 'just', 'over', 'under', 'very', 'when', 'where', 'because',
  'someone', 'something', 'around', 'after', 'before', 'into', 'onto', 'through', 'back', 'only', 'even'
]);

function createContext(profile, features) {
  return {
    sensoryNotes: [],
    focusAgenda: '',
    conflictLevel: 0,
    emotionalAlarm: 0,
    moodScore: 0,
    moodDescriptor: 'neutral',
    memories: [],
    actionPlan: '',
    rationale: '',
    insights: [],
    cadence: profile.emotionStyle === 'steady' ? 'measured' : profile.emotionStyle === 'expressive' ? 'vivid' : 'guarded',
    cautionBias: profile.risk === 'cautious' ? 0.25 : profile.risk === 'bold' ? -0.2 : 0,
    optimism: profile.outlook === 'optimistic' ? 0.2 : profile.outlook === 'pessimistic' ? -0.2 : 0,
    scenarioFeatures: features
  };
}

function simulateRegion(regionId, profile, features, context, scenario) {
  const handlers = {
    visual: simulateVisual,
    auditory: simulateAuditory,
    anterior: simulateAnterior,
    amygdala: simulateAmygdala,
    limbic: simulateLimbic,
    hippocampus: simulateHippocampus,
    motor: simulateMotor,
    prefrontal: simulatePrefrontal
  };

  return handlers[regionId](profile, features, context, scenario);
}

function simulateVisual(profile, features, context, scenario) {
  const detailDrive = (profile.bigFive.openness + profile.iq * 0.4) / 200;
  const clarity = clamp(32 + features.visual * 28 + features.motion * 15 + detailDrive * 40, 14, 100);
  const subject = features.keySubjects[0] || 'the scene';
  const motionTone = features.motion > 1 ? 'closing the distance steadily' : features.motion > 0 ? 'in motion' : 'fairly still';
  const ambience = features.environment === 'nature' ? 'dappled natural light' : features.environment === 'urban' ? 'angular urban silhouettes' : 'ambient glow';

  const descriptors = [];
  if (features.threat > 0) descriptors.push('watching posture for threat signals');
  if (features.positive > 0) descriptors.push('noting gentle cues and warmth');
  if (features.mystery > 0) descriptors.push('tracking obscured details and shadowed edges');
  if (features.objects > 0) descriptors.push('tagging nearby objects for relevance');

  const message = `Framing ${subject}; ${motionTone}, under ${ambience}. ${descriptors.join(' • ') || 'No major anomalies detected.'}`;
  const summary = `Visual lock on ${subject}, clarity ${Math.round(clarity)}%.`;

  context.sensoryNotes.push(message);
  context.insights.push(`Visual focus on ${subject}.`);

  return {
    message,
    summary,
    highlight: `Detail emphasis ${Math.round(clarity)}%`,
    activity: clarity,
    streamText: `Observations prioritize ${subject}, with ${motionTone} and ${ambience}.`
  };
}

function simulateAuditory(profile, features, context) {
  const sensitivity = clamp(28 + features.auditory * 35 + profile.bigFive.agreeableness * 0.2 + (features.social > 0 ? 12 : 0), 10, 95);
  const quiet = features.auditory === 0;
  const message = quiet
    ? 'Soundscape minimal; leaning on visual cues while listening for shifts.'
    : `Parsing ${features.auditory > 2 ? 'layered' : 'subtle'} audio cues—${features.social > 0 ? 'voices suggest social context.' : 'ambient noises mapped.'}`;
  const summary = quiet ? 'Low auditory input, vigilance maintained.' : 'Auditory map constructed.';

  context.sensoryNotes.push(message);
  context.insights.push('Audio channel calibrated.');

  return {
    message,
    summary,
    highlight: quiet ? 'Silence flagged' : 'Acoustic texture logged',
    activity: sensitivity,
    streamText: message
  };
}

function simulateAnterior(profile, features, context) {
  const conscientious = profile.bigFive.conscientiousness / 100;
  const conflict = Math.abs(features.positivity - features.negativity);
  const urgency = features.urgency;
  const activity = clamp(38 + urgency * 30 + conscientious * 35 + conflict * 22, 18, 100);
  const focusTarget = context.sensoryNotes[0] || 'primary stimulus';

  const agenda = features.threat > 0.5
    ? 'Prioritize safety posture and gather more threat indicators.'
    : features.positivity > 0.4
      ? 'Open channel for rapport while monitoring variability.'
      : 'Balance data gathering with cautious readiness.';

  context.focusAgenda = agenda;
  context.conflictLevel = conflict;
  context.insights.push(`Attention directive: ${agenda}`);

  const message = `Routing attention: ${agenda} Current focus anchored to ${focusTarget}.`;
  return {
    message,
    summary: `Agenda set: ${agenda}`,
    highlight: `Conflict level ${(conflict * 100).toFixed(0)}%`,
    activity,
    streamText: message
  };
}

function simulateAmygdala(profile, features, context) {
  const neuroticism = profile.bigFive.neuroticism / 100;
  const baseAlarm = clamp(features.threat * 0.6 + features.negativity * 0.4 + neuroticism * 0.5 - context.optimism, 0, 1);
  const emotionMod = profile.emotionStyle === 'expressive' ? 0.08 : profile.emotionStyle === 'guarded' ? -0.06 : 0;
  const alarm = clamp(baseAlarm + emotionMod, 0, 1);
  const activity = clamp(32 + alarm * 58 + context.conflictLevel * 22, 12, 100);

  const descriptor = alarm > 0.7
    ? 'Adrenal axis primed—perceiving high threat.'
    : alarm > 0.4
      ? 'Alert raised; ready to escalate if cues worsen.'
      : alarm > 0.2
        ? 'Moderate caution with emotional brakes engaged.'
        : 'Calm vigilance; emotional field remains steady.';

  const message = `${descriptor} (alarm ${(alarm * 100).toFixed(0)}%).`;

  context.emotionalAlarm = alarm;
  context.insights.push('Amygdala calibrated emotional urgency.');

  return {
    message,
    summary: `Emotional alarm ${(alarm * 100).toFixed(0)}%`,
    highlight: descriptor,
    activity,
    streamText: `Assessing emotional stakes: ${descriptor}`
  };
}

function simulateLimbic(profile, features, context) {
  const baseline = features.positivity - features.negativity;
  const optimism = context.optimism;
  const moodRaw = clamp(baseline + optimism - context.emotionalAlarm * 0.45 + (profile.bigFive.agreeableness - 50) / 240, -1, 1);
  context.moodScore = moodRaw;

  let descriptor;
  if (moodRaw > 0.5) descriptor = 'Warm anticipation and trust forming.';
  else if (moodRaw > 0.15) descriptor = 'Cautious optimism—feelings lean positive.';
  else if (moodRaw > -0.2) descriptor = 'Neutral baseline maintained.';
  else if (moodRaw > -0.6) descriptor = 'Edging into concern; emotions dampened.';
  else descriptor = 'Heavy apprehension saturates the mood.';

  context.moodDescriptor = descriptor;
  context.insights.push(`Mood anchor: ${descriptor}`);

  const activity = clamp(34 + Math.abs(moodRaw) * 48 + context.emotionalAlarm * 25, 16, 96);

  return {
    message: `${descriptor} Emotional color ${Math.round((moodRaw + 1) * 50)}%.`,
    summary: descriptor,
    highlight: `Mood vector ${(moodRaw * 100).toFixed(0)}%`,
    activity,
    streamText: descriptor
  };
}

function simulateHippocampus(profile, features, context, scenario) {
  const recallFactor = profile.ageTraits.recall;
  const curiosity = profile.bigFive.openness / 100;
  const intensity = clamp(28 + recallFactor * 40 + features.hasMemoryCue * 18 + curiosity * 20, 12, 92);
  let memory;

  if (features.hasMemoryCue) {
    memory = 'Triggered explicit memory—scenario resonates with past experience mentioned.';
  } else if (profile.background) {
    memory = `Drawing on ${profile.background.toLowerCase()} background for pattern recognition.`;
  } else {
    memory = 'Scanning episodic archives for relevant analogues despite limited cues.';
  }

  if (features.keySubjects.length > 0) {
    memory += ` Linking to prior encounters with ${features.keySubjects[0]}.`;
  }

  context.memories.push(memory);
  context.insights.push('Memory anchors layered into current model.');

  return {
    message: memory,
    summary: 'Memory synthesis engaged.',
    highlight: `Recall energy ${Math.round(intensity)}%`,
    activity: intensity,
    streamText: memory
  };
}

function simulateMotor(profile, features, context) {
  const iqFactor = profile.iq / 160;
  const riskBias = profile.risk === 'bold' ? 0.25 : profile.risk === 'cautious' ? -0.25 : 0;
  const calm = 1 - context.emotionalAlarm;
  const readiness = clamp(32 + iqFactor * 30 + calm * 25 + (context.moodScore + 1) * 10 + (riskBias - context.cautionBias) * 30, 15, 95);

  let plan;
  if (features.threat > 0.6 || context.emotionalAlarm > 0.65) {
    plan = 'Adopt defensive stance, widen distance, prepare escape or deterrent gesture.';
  } else if (features.positivity > 0.4) {
    plan = 'Relax posture, open palms, signal welcome while retaining situational awareness.';
  } else if (features.objects > 0.6) {
    plan = 'Inspect object methodically before interaction; ready careful manipulation.';
  } else {
    plan = 'Hold neutral stance, observe for new data before committing to motion.';
  }

  context.actionPlan = plan;
  context.insights.push(`Motor plan: ${plan}`);

  return {
    message: plan,
    summary: 'Action posture drafted.',
    highlight: `Readiness ${Math.round(readiness)}%`,
    activity: readiness,
    streamText: `Preparing body: ${plan}`
  };
}

function simulatePrefrontal(profile, features, context, scenario) {
  const complexity = clamp(38 + (profile.iq - 90) * 0.5 + profile.bigFive.conscientiousness * 0.2 + profile.ageTraits.wisdom * 35, 25, 100);
  const reasoningStyle = complexity > 80 ? 'multi-layer reasoning' : complexity > 60 ? 'strategic synthesis' : 'pragmatic synthesis';
  const sentiment = context.moodScore > 0.4 ? 'lean toward engagement' : context.moodScore < -0.3 ? 'exercise restraint' : 'maintain balanced posture';
  const safetyCall = context.emotionalAlarm > 0.65 ? 'Keep distance and seek support if available.' : context.actionPlan;

  const summary = `Conclusion: ${sentiment}. Selected course—${safetyCall}`;
  const message = `${reasoningStyle} applied. ${summary} Integrating memories (${context.memories.length}) and sensory threads (${context.sensoryNotes.length}).`;
  context.rationale = message;

  return {
    message,
    summary,
    highlight: `Executive load ${Math.round(complexity)}%`,
    activity: complexity,
    streamText: message
  };
}

function generateClaudeResponse(profile, scenario, features, context) {
  const tone = context.moodScore > 0.2 ? 'warm' : context.moodScore < -0.3 ? 'guarded' : 'even';
  const action = formatActionForBaseline(context.actionPlan);
  const personaSummary = describePersona(profile);
  return `Baseline analysis (${tone} tone): ${personaSummary} In response to “${scenario}”, they would ${action} This outlook reflects an IQ of ${profile.iq} and a ${profile.outlook} temperament.`;
}

function updateRegionCard(regionId, text, activity) {
  const card = document.querySelector(`.region-card[data-region="${regionId}"]`);
  if (!card) return;
  const body = card.querySelector('.region-text');
  const bar = card.querySelector('.activity-bar div');
  body.textContent = text;
  if (bar) {
    bar.style.width = `${Math.max(activity, 5)}%`;
  }
}

function appendStreamEntry(author, message) {
  const stream = document.getElementById('consciousnessStream');
  const entry = document.createElement('div');
  entry.className = 'entry';
  entry.innerHTML = `<strong>${author}</strong><br>${message}`;
  stream.appendChild(entry);
  stream.scrollTop = stream.scrollHeight;
}

function addTimelineEvent(step, regionName, highlight, activity) {
  const container = document.getElementById('timelineEvents');
  const event = document.createElement('div');
  event.className = 'event';
  event.innerHTML = `<strong>Step ${step}: ${regionName}</strong><span>${highlight}</span><span>Activity ${Math.round(activity)}%</span>`;
  container.appendChild(event);
  container.scrollTop = container.scrollHeight;
}

function registerActivity(regionId, value, label) {
  intensityState = Object.fromEntries(regionSequence.map((id) => [id, (intensityState[id] || 0) * 0.55]));
  intensityState[regionId] = value;
  timelineSnapshots.push({
    label,
    snapshot: { ...intensityState }
  });
  drawGraph();
}

function clearSimulation() {
  timelineSnapshots = [];
  intensityState = {};
  document.getElementById('consciousnessStream').innerHTML = '';
  document.getElementById('timelineEvents').innerHTML = '';
  document.getElementById('claudeResponse').textContent = 'Run the simulation to compare a traditional single-voice response.';
  regionSequence.forEach((id) => updateRegionCard(id, defaultRegionText[id], 6));
  setActiveRegion(null, null);
  drawGraph();
  scheduleFlowchart();
}

const defaultRegionText = {
  visual: 'Awaiting sensory input.',
  auditory: 'Listening for cues.',
  anterior: 'Scanning priorities.',
  amygdala: 'Ready to escalate emotions.',
  limbic: 'Awaiting emotional tone.',
  hippocampus: 'Preparing recollections.',
  motor: 'Waiting on directives.',
  prefrontal: 'Ready to integrate the whole picture.'
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function drawGraph() {
  const canvas = document.getElementById('activityCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const ratio = window.devicePixelRatio || 1;
  const displayWidth = Math.floor(canvas.clientWidth * ratio);
  const displayHeight = Math.floor(canvas.clientHeight * ratio);
  if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
    canvas.width = displayWidth;
    canvas.height = displayHeight;
  }
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
  ctx.fillRect(0, 0, width, height);

  const margin = { top: 28, right: 28, bottom: 48, left: 60 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  ctx.strokeStyle = 'rgba(148, 197, 255, 0.2)';
  ctx.lineWidth = 1;
  for (let value = 0; value <= 100; value += 25) {
    const y = margin.top + (1 - value / 100) * plotHeight;
    ctx.beginPath();
    ctx.moveTo(margin.left, y);
    ctx.lineTo(width - margin.right, y);
    ctx.stroke();

    ctx.fillStyle = 'rgba(148, 197, 255, 0.55)';
    ctx.font = '11px "Segoe UI"';
    ctx.fillText(`${value}%`, 14, y + 4);
  }

  ctx.strokeStyle = 'rgba(148, 197, 255, 0.4)';
  ctx.beginPath();
  ctx.moveTo(margin.left, margin.top);
  ctx.lineTo(margin.left, height - margin.bottom);
  ctx.lineTo(width - margin.right, height - margin.bottom);
  ctx.stroke();

  if (timelineSnapshots.length === 0) {
    drawLegend(ctx, margin, plotWidth);
    return;
  }

  const steps = timelineSnapshots.length;
  const stepWidth = steps > 1 ? plotWidth / (steps - 1) : 0;

  regionSequence.forEach((regionId) => {
    ctx.beginPath();
    ctx.strokeStyle = regionMeta[regionId].color;
    ctx.lineWidth = 2;
    timelineSnapshots.forEach((snapshot, index) => {
      const intensity = snapshot.snapshot[regionId] || 0;
      const x = margin.left + index * stepWidth;
      const y = margin.top + (1 - intensity / 100) * plotHeight;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    timelineSnapshots.forEach((snapshot, index) => {
      const intensity = snapshot.snapshot[regionId] || 0;
      const x = margin.left + index * stepWidth;
      const y = margin.top + (1 - intensity / 100) * plotHeight;
      ctx.fillStyle = regionMeta[regionId].color;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  });

  ctx.fillStyle = 'rgba(148, 197, 255, 0.65)';
  ctx.font = '11px "Segoe UI"';
  timelineSnapshots.forEach((snapshot, index) => {
    const x = margin.left + index * stepWidth;
    ctx.fillText(`S${index + 1}`, x - 10, height - margin.bottom + 18);
    ctx.fillText(shortenLabel(snapshot.label), x - 10, height - margin.bottom + 32);
  });

  drawLegend(ctx, margin, plotWidth);
}

function drawLegend(ctx, margin, plotWidth) {
  const legendWidth = 150;
  const startX = margin.left + plotWidth - legendWidth;
  let currentY = margin.top - 14;
  ctx.font = '11px "Segoe UI"';
  regionSequence.forEach((regionId) => {
    ctx.fillStyle = regionMeta[regionId].color;
    ctx.fillRect(startX, currentY, 10, 10);
    ctx.fillStyle = 'rgba(226, 232, 240, 0.85)';
    ctx.fillText(regionMeta[regionId].name, startX + 16, currentY + 9);
    currentY += 16;
  });
}

function shortenLabel(text) {
  if (!text) return '';
  if (text.length < 20) return text;
  return `${text.slice(0, 18)}…`;
}

function setActiveRegion(currentId, previousId) {
  currentActiveRegion = currentId || null;
  previousActiveRegion = previousId || null;

  document.querySelectorAll('.region-card').forEach((card) => {
    card.classList.remove('active', 'previous');
  });

  flowSegments.forEach((segment) => segment.classList.remove('active'));

  if (!currentId) {
    return;
  }

  const currentCard = document.querySelector(`.region-card[data-region="${currentId}"]`);
  if (currentCard) {
    currentCard.classList.add('active');
  }

  if (previousId) {
    const previousCard = document.querySelector(`.region-card[data-region="${previousId}"]`);
    if (previousCard) {
      previousCard.classList.add('previous');
    }
  }

  applyFlowSegmentHighlight();
}

function applyFlowSegmentHighlight() {
  if (!previousActiveRegion || !currentActiveRegion) {
    return;
  }

  flowSegments.forEach((segment) => {
    const from = segment.getAttribute('data-from');
    const to = segment.getAttribute('data-to');
    if (from === previousActiveRegion && to === currentActiveRegion) {
      segment.classList.add('active');
    }
  });
}

function scheduleFlowchart() {
  if (typeof window === 'undefined' || typeof requestAnimationFrame === 'undefined') {
    setupFlowchart();
    return;
  }
  if (flowchartFrame) {
    cancelAnimationFrame(flowchartFrame);
  }
  flowchartFrame = requestAnimationFrame(() => {
    flowchartFrame = null;
    setupFlowchart();
  });
}

function setupFlowchart() {
  const container = document.querySelector('.brain-topology');
  const svg = document.getElementById('flowchartCanvas');
  if (!container || !svg) return;

  const rect = container.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;

  svg.setAttribute('width', rect.width);
  svg.setAttribute('height', rect.height);
  svg.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
  svg.innerHTML = '';
  flowSegments = [];

  const positions = regionSequence.map((regionId) => {
    const card = document.querySelector(`.region-card[data-region="${regionId}"]`);
    if (!card) return null;
    const bounds = card.getBoundingClientRect();
    return {
      id: regionId,
      x: bounds.left - rect.left + bounds.width / 2,
      top: bounds.top - rect.top,
      bottom: bounds.bottom - rect.top
    };
  });

  for (let i = 0; i < positions.length - 1; i += 1) {
    const current = positions[i];
    const next = positions[i + 1];
    if (!current || !next) continue;

    const startX = current.x;
    const startY = current.bottom;
    const endX = next.x;
    const endY = next.top;
    const midY = startY + (endY - startY) / 2;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('class', 'flow-segment');
    path.setAttribute('data-from', current.id);
    path.setAttribute('data-to', next.id);
    path.setAttribute('d', `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`);

    svg.appendChild(path);
    flowSegments.push(path);
  }

  applyFlowSegmentHighlight();
}

function createIntegrativeSummary(context) {
  const mood = context.moodDescriptor || 'Mood baseline holding steady.';
  const plan = context.actionPlan ? context.actionPlan : 'Hold position until more evidence arrives.';
  const insights = context.insights.length > 0
    ? `Key insights: ${context.insights.slice(-3).join(' ')}`
    : 'Insights remain preliminary.';
  return `${mood} ${plan} ${insights}`;
}

function exportProfile(profile) {
  const payload = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    summary: describePersona(profile),
    profile
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const slugSource = profile.background && profile.background.trim() ? profile.background : `${profile.ageGroup} persona`;
  link.href = url;
  link.download = `neural-profile-${slugify(slugSource) || 'character'}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function randomizeProfile() {
  const ageInput = document.getElementById('age');
  if (ageInput) {
    ageInput.value = randomInt(12, 72);
    updateRangeDisplay(ageInput);
  }

  const iqInput = document.getElementById('iq');
  if (iqInput) {
    iqInput.value = randomInt(85, 145);
    updateRangeDisplay(iqInput);
  }

  setSelectRandom('gender');
  setSelectRandom('outlook');
  setSelectRandom('risk');
  setSelectRandom('emotionStyle');

  const backgroundInput = document.getElementById('background');
  if (backgroundInput) {
    backgroundInput.value = Math.random() > 0.2 ? randomChoice(backgroundIdeas) : '';
  }

  document.querySelectorAll('.personality .trait input').forEach((input) => {
    input.value = randomInt(25, 90);
    updateRangeDisplay(input);
  });

  scheduleFlowchart();
}

function setSelectRandom(id) {
  const select = document.getElementById(id);
  if (!select) return;
  const options = optionPools[id] || Array.from(select.options).map((option) => option.value);
  const choice = randomChoice(options);
  if (choice !== undefined) {
    select.value = choice;
  }
}

function updateRangeDisplay(input) {
  if (!input) return;
  const label = input.closest('label');
  let display = null;
  if (label) {
    display = label.querySelector('.value');
    if (!display && label.nextElementSibling && label.nextElementSibling.classList.contains('value')) {
      display = label.nextElementSibling;
    }
  }
  if (!display) {
    const trait = input.closest('.trait');
    if (trait) {
      display = trait.querySelector('.value');
    }
  }
  if (display) {
    display.textContent = input.value;
  }
}

function describePersona(profile) {
  const genderMap = {
    female: 'female',
    male: 'male',
    nonbinary: 'non-binary',
    unspecified: 'unspecified gender'
  };
  const riskMap = {
    cautious: 'a cautious risk posture',
    balanced: 'a balanced risk posture',
    bold: 'a risk-forward posture'
  };
  const emotionMap = {
    steady: 'steady emotional cadence',
    expressive: 'expressive emotional cadence',
    guarded: 'guarded emotional cadence'
  };

  const genderText = genderMap[profile.gender] || profile.gender || 'unspecified gender';
  const riskText = riskMap[profile.risk] || 'a balanced risk posture';
  const emotionText = emotionMap[profile.emotionStyle] || 'steady emotional cadence';
  const backgroundText = profile.background && profile.background.trim() ? profile.background.trim() : 'generalist';
  const traitSummary = summarizeTopTraits(profile.bigFive);
  const traitText = traitSummary ? `${traitSummary} ` : '';
  const ageDescriptor = profile.ageGroup ? capitalize(profile.ageGroup) : 'Adult';

  return `Persona summary: ${ageDescriptor} ${backgroundText} (${genderText}) with a ${profile.outlook} outlook, ${emotionText}, and ${riskText}. ${traitText}Intellectual depth: IQ ${profile.iq}.`;
}

function summarizeTopTraits(bigFive = {}) {
  const entries = Object.entries(bigFive);
  if (entries.length === 0) return '';
  const sorted = [...entries].sort((a, b) => b[1] - a[1]);
  const topTraits = sorted.slice(0, 2).map(([trait, value]) => `${traitLabelMap[trait] || trait} ${value}`);
  return `Standout traits: ${topTraits.join(', ')}.`;
}

function formatActionForBaseline(actionPlan) {
  const fallback = 'maintain observation before acting.';
  if (!actionPlan) return fallback;
  const trimmed = actionPlan.trim();
  if (!trimmed) return fallback;
  const lowered = trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
  return lowered.endsWith('.') ? lowered : `${lowered}.`;
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function capitalize(word) {
  if (!word) return '';
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(values) {
  if (!Array.isArray(values) || values.length === 0) return undefined;
  const index = Math.floor(Math.random() * values.length);
  return values[index];
}
