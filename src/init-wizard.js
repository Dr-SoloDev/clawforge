/**
 * ClawForge — Init Wizard
 * Interactive CLI script generator
 * Uses Node.js built-in readline (no external dependencies)
 */

import { createInterface } from 'readline';
import { stdin as input, stdout as output, env } from 'process';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

function question(rl, query) {
  return new Promise((resolve) => {
    rl.question(query, (answer) => resolve(answer));
  });
}

function isInteractive() {
  return input.isTTY && output.isTTY;
}

const COMMON_VOICES = [
  { label: 'en-US-AndrewMultilingualNeural', desc: 'English (US) — Male, natural' },
  { label: 'en-US-AvaMultilingualNeural', desc: 'English (US) — Female, warm' },
  { label: 'en-US-BrianMultilingualNeural', desc: 'English (US) — Male, clear' },
  { label: 'en-US-EmmaMultilingualNeural', desc: 'English (US) — Female, friendly' },
  { label: 'en-GB-RyanNeural', desc: 'English (UK) — Male, British' },
  { label: 'en-GB-SoniaNeural', desc: 'English (UK) — Female, British' },
  { label: 'ja-JP-NanamiNeural', desc: 'Japanese — Female' },
  { label: 'zh-CN-XiaoxiaoNeural', desc: 'Chinese — Female' },
  { label: 'th-TH-PremwadeeNeural', desc: 'Thai — Female' },
  { label: 'fr-FR-DeniseNeural', desc: 'French — Female' },
  { label: 'de-DE-KatjaNeural', desc: 'German — Female' },
  { label: 'es-ES-AlvaroNeural', desc: 'Spanish — Male' },
  { label: 'ko-KR-SunHiNeural', desc: 'Korean — Female' },
];

const ACTION_TYPES = [
  { value: 'goto', desc: 'Navigate to a URL' },
  { value: 'click', desc: 'Click an element' },
  { value: 'fill', desc: 'Type text into a field' },
  { value: 'press', desc: 'Press a keyboard key' },
  { value: 'scroll', desc: 'Scroll the page' },
  { value: 'wait', desc: 'Wait for a duration' },
  { value: 'screenshot', desc: 'Take a screenshot' },
];

const TEMPLATES = [
  { id: 'blank', desc: 'Start from scratch' },
  { id: 'landing-page', desc: 'SaaS landing page demo' },
  { id: 'hackathon', desc: 'Pitch deck style — intro, problem, solution' },
  { id: 'saas-demo', desc: 'Full product walkthrough with signup' },
  { id: 'tutorial', desc: 'Step-by-step tutorial with narration' },
  { id: 'mobile-app', desc: 'Mobile viewport (375x812) demo' },
];

const BLANK_TEMPLATE = {
  project: {
    name: 'My Demo',
    url: 'http://localhost:3000',
    output: './output',
    viewport: { width: 1280, height: 720 },
  },
  voice: {
    engine: 'edge-tts',
    voice: 'en-US-AndrewMultilingualNeural',
    rate: '-5%',
  },
  scenes: [],
};

const TEMPLATE_SCENES = {
  'landing-page': [
    { name: 'intro', narration: 'Welcome to our platform — the easiest way to get started.', actions: [{ type: 'goto', url: '{{url}}' }, { type: 'wait', ms: 3000 }, { type: 'scroll', dy: 400 }] },
    { name: 'features', narration: 'See how our features can help you work smarter.', actions: [{ type: 'scroll', dy: 600 }, { type: 'wait', ms: 3000 }] },
    { name: 'cta', narration: 'Ready to get started? Sign up today.', actions: [{ type: 'scroll', y: 0 }, { type: 'click', selector: 'text=Get Started' }, { type: 'wait', ms: 3000 }] },
  ],
  'hackathon': [
    { name: 'problem', narration: 'The problem we solve is simple — teams waste too much time on manual tasks.', actions: [{ type: 'goto', url: '{{url}}' }, { type: 'wait', ms: 3000 }] },
    { name: 'solution', narration: 'Our solution automates the repetitive work so you can focus on what matters.', actions: [{ type: 'scroll', dy: 500 }, { type: 'wait', ms: 3000 }] },
    { name: 'demo', narration: 'Here is a quick walkthrough of how it works.', actions: [{ type: 'click', selector: 'text=Try Demo' }, { type: 'wait', ms: 5000 }] },
    { name: 'closing', narration: 'We are live on Product Hunt today — check us out!', actions: [{ type: 'scroll', y: 0 }, { type: 'wait', ms: 3000 }] },
  ],
  'saas-demo': [
    { name: 'opening', narration: 'Welcome to our app — the fastest way to manage your workflow.', actions: [{ type: 'goto', url: '{{url}}' }, { type: 'wait', ms: 3000 }, { type: 'scroll', dy: 300 }] },
    { name: 'signup', narration: 'Signing up takes just a few seconds.', actions: [{ type: 'click', selector: 'text=Sign Up' }, { type: 'wait', ms: 2000 }, { type: 'fill', selector: 'input[type=email]', text: 'demo@example.com' }, { type: 'press', key: 'Enter' }, { type: 'wait', ms: 4000 }] },
    { name: 'dashboard', narration: 'Here is your dashboard — everything you need in one place.', actions: [{ type: 'scroll', dy: 400 }, { type: 'wait', ms: 3000 }] },
    { name: 'closing', narration: 'That is all. Try it today!', actions: [{ type: 'scroll', y: 0 }, { type: 'wait', ms: 3000 }] },
  ],
  'tutorial': [
    { name: 'step1', narration: 'Welcome to this tutorial. Let us get started with step one.', actions: [{ type: 'goto', url: '{{url}}' }, { type: 'wait', ms: 3000 }] },
    { name: 'step2', narration: 'First, click on the settings menu to configure your preferences.', actions: [{ type: 'click', selector: 'text=Settings' }, { type: 'wait', ms: 2000 }] },
    { name: 'step3', narration: 'Enter your configuration details and save.', actions: [{ type: 'fill', selector: 'input[name=config]', text: 'your-config-value' }, { type: 'press', key: 'Enter' }, { type: 'wait', ms: 3000 }] },
    { name: 'done', narration: 'That is it! You have completed the tutorial.', actions: [{ type: 'scroll', y: 0 }, { type: 'wait', ms: 3000 }] },
  ],
  'mobile-app': [
    { name: 'intro', narration: 'Welcome to our mobile app — built for productivity on the go.', actions: [{ type: 'goto', url: '{{url}}' }, { type: 'wait', ms: 3000 }] },
    { name: 'feature1', narration: 'Swipe through your daily tasks with ease.', actions: [{ type: 'scroll', dy: 400 }, { type: 'wait', ms: 3000 }] },
    { name: 'feature2', narration: 'Tap any task to see details and manage your workflow.', actions: [{ type: 'click', selector: 'text=View Details' }, { type: 'wait', ms: 3000 }] },
    { name: 'outro', narration: 'Download the app today and stay productive anywhere.', actions: [{ type: 'scroll', y: 0 }, { type: 'wait', ms: 3000 }] },
  ],
};

export async function runWizard(options = {}) {
  // Non-interactive mode: use template or defaults
  if (!isInteractive()) {
    return runNonInteractive(options);
  }

  const rl = createInterface({ input, output });

  const cleanup = () => { try { rl.close(); } catch {} };

  console.log('');
  console.log('  ⚡ ClawForge — Project Initializer');
  console.log('  ─────────────────────────────');
  console.log('  Answer a few questions to generate your script.\n');

  // --- Pick template ---
  console.log('  Available templates:');
  for (const t of TEMPLATES) {
    console.log(`    ${t.id.padEnd(16)} ${t.desc}`);
  }

  const templateId = options.template || (await question(rl, '\n  Template [blank]: ')) || 'blank';
  const validTemplate = TEMPLATES.find(t => t.id === templateId);
  const useTemplate = validTemplate ? templateId : 'blank';

  // --- Project info ---
  const projectName = (await question(rl, '  Project name [My Demo]: ')) || 'My Demo';
  const targetUrl = (await question(rl, '  Target URL [http://localhost:3000]: ')) || 'http://localhost:3000';

  const viewportStr = (await question(rl, '  Viewport [1280x720]: ')) || '1280x720';
  const [vw, vh] = viewportStr.split('x').map(Number);

  // --- Voice ---
  console.log('\n  Available voices:');
  COMMON_VOICES.forEach((v, i) => {
    console.log(`    ${String(i + 1).padStart(2)}) ${v.label.padEnd(44)} ${v.desc}`);
  });
  console.log(`    ${COMMON_VOICES.length + 1}) Custom voice`);

  const voiceChoice = (await question(rl, '\n  Voice [1]: ')) || '1';
  const voiceIdx = parseInt(voiceChoice, 10) - 1;
  let voice = COMMON_VOICES[0].label;
  if (voiceIdx >= 0 && voiceIdx < COMMON_VOICES.length) {
    voice = COMMON_VOICES[voiceIdx].label;
  } else {
    voice = (await question(rl, '  Enter custom voice name: ')) || voice;
  }

  if (useTemplate !== 'blank') {
    cleanup();
    return buildFromTemplate(useTemplate, projectName, targetUrl, vw || 1280, vh || 720, voice);
  }

  // --- Blank: Custom scenes ---
  const scenesStr = (await question(rl, '\n  Number of scenes [3]: ')) || '3';
  const numScenes = Math.max(1, parseInt(scenesStr, 10) || 3);

  const scenes = [];
  for (let i = 0; i < numScenes; i++) {
    console.log(`\n  ── Scene ${i + 1} ──`);
    const sceneName = (await question(rl, `    Name [scene-${String(i + 1).padStart(2, '0')}]: `)) || `scene-${String(i + 1).padStart(2, '0')}`;
    const narration = await question(rl, '    Narration text (voiceover): ');

    const actions = [];
    let addMore = true;
    while (addMore) {
      console.log('\n    Actions:');
      ACTION_TYPES.forEach((a, j) => {
        console.log(`      ${j + 1}) ${a.value.padEnd(12)} ${a.desc}`);
      });
      const actionChoice = (await question(rl, '    Action type [1]: ')) || '1';
      const actionIdx = parseInt(actionChoice, 10) - 1;
      const actionType = ACTION_TYPES[actionIdx]?.value || 'goto';

      const action = { type: actionType };

      switch (actionType) {
        case 'goto':
          action.url = await question(rl, `      URL [${targetUrl}]: `) || targetUrl;
          break;
        case 'click':
          action.selector = await question(rl, '      CSS/text selector: ');
          break;
        case 'fill':
          action.selector = await question(rl, '      Selector: ');
          action.text = await question(rl, '      Text to type: ');
          break;
        case 'press':
          action.key = await question(rl, '      Key (e.g. Enter, Control+Enter): ');
          break;
        case 'scroll':
          const scrollOpt = (await question(rl, '      Absolute Y or relative dy? (y/dy) [dy]: ')) || 'dy';
          if (scrollOpt === 'y') {
            action.y = parseInt(await question(rl, '      Scroll to Y position: '), 10) || 0;
          } else {
            action.dy = parseInt(await question(rl, '      Scroll by pixels: '), 10) || 300;
          }
          break;
        case 'wait':
          action.ms = parseInt(await question(rl, '      Milliseconds [2000]: '), 10) || 2000;
          break;
        case 'screenshot':
          action.name = (await question(rl, '      Screenshot name [screenshot]: ')) || undefined;
          break;
      }

      actions.push(action);
      addMore = (await question(rl, '    Add another action? (y/N): ')).toLowerCase() === 'y';
    }

    scenes.push({
      name: sceneName.replace(/[^a-z0-9_-]/gi, '_').toLowerCase(),
      narration,
      actions,
      pauseAfter: 1500,
    });
  }

  cleanup();
  return {
    project: {
      name: projectName,
      url: targetUrl,
      output: './output',
      viewport: { width: vw || 1280, height: vh || 720 },
    },
    voice: { engine: 'edge-tts', voice, rate: '-5%' },
    scenes,
  };
}

/** Non-interactive mode — use template or defaults */
function runNonInteractive(options) {
  const templateId = options.template || 'landing-page';
  const validTemplate = TEMPLATES.find(t => t.id === templateId);
  const useTemplate = validTemplate ? templateId : 'landing-page';

  const projectName = 'My Demo';
  const targetUrl = 'http://localhost:3000';
  const vw = 1280;
  const vh = 720;
  const voice = COMMON_VOICES[0].label;

  if (useTemplate === 'blank') {
    return {
      project: { name: projectName, url: targetUrl, output: './output', viewport: { width: vw, height: vh } },
      voice: { engine: 'edge-tts', voice, rate: '-5%' },
      scenes: [
        { name: 'intro', narration: 'Welcome to the demo.', actions: [{ type: 'goto', url: targetUrl }, { type: 'wait', ms: 3000 }], pauseAfter: 1500 },
      ],
    };
  }

  return buildFromTemplate(useTemplate, projectName, targetUrl, vw, vh, voice);
}

/** Build a script from a named template */
function buildFromTemplate(templateId, projectName, targetUrl, vw, vh, voice) {
  const templateScenes = TEMPLATE_SCENES[templateId] || TEMPLATE_SCENES['landing-page'];
  const scenes = templateScenes.map(s => ({
    ...s,
    actions: s.actions.map(a => ({
      ...a,
      ...(a.url !== undefined ? { url: a.url === '{{url}}' ? targetUrl : a.url } : {}),
    })),
  }));

  return {
    project: {
      name: projectName,
      url: targetUrl,
      output: './output',
      viewport: { width: vw, height: vh },
    },
    voice: { engine: 'edge-tts', voice, rate: '-5%' },
    scenes,
  };
}

export function writeScript(script, outputPath) {
  const yaml = stringifyScript(script);
  writeFileSync(outputPath, yaml, 'utf-8');
  return outputPath;
}

function stringifyScript(script) {
  const lines = [];
  lines.push('# ClawForge Script');
  lines.push(`# Generated by: clawforge init`);
  lines.push(`# Project: ${script.project.name}\n`);

  lines.push('project:');
  lines.push(`  name: "${script.project.name}"`);
  lines.push(`  url: "${script.project.url}"`);
  lines.push(`  output: "${script.project.output}"`);
  lines.push('  viewport:');
  lines.push(`    width: ${script.project.viewport.width}`);
  lines.push(`    height: ${script.project.viewport.height}`);
  lines.push('');
  lines.push('voice:');
  lines.push('  engine: "edge-tts"');
  lines.push(`  voice: "${script.voice.voice}"`);
  lines.push(`  rate: "${script.voice.rate}"`);
  lines.push('');
  lines.push('scenes:');

  for (const scene of script.scenes) {
    lines.push(`  - name: "${scene.name}"`);
    if (scene.narration) {
      lines.push(`    narration: "${scene.narration}"`);
    }
    lines.push('    actions:');
    for (const action of scene.actions) {
      const entries = Object.entries(action)
        .filter(([_, v]) => v !== undefined && v !== null)
        .map(([k, v]) => {
          if (typeof v === 'string') return `${k}: "${v}"`;
          return `${k}: ${v}`;
        });
      lines.push(`      - { ${entries.join(', ')} }`);
    }
    if (scene.pauseAfter !== undefined) {
      lines.push(`    pauseAfter: ${scene.pauseAfter}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
