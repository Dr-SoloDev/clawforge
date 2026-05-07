/**
 * AgentCast — Script Loader
 * Parses YAML/JSON script files into scene objects.
 */

import { readFileSync } from 'fs';
import { parse as parseYaml } from 'yaml';
import { extname } from 'path';

const DEFAULTS = {
  project: {
    name: 'Untitled',
    url: 'http://localhost:3000',
    output: './output',
    viewport: { width: 1280, height: 720 },
  },
  voice: {
    engine: 'edge-tts',
    voice: 'en-US-AndrewMultilingualNeural',
    rate: '-5%',
  },
};

export function loadScript(filePath) {
  const raw = readFileSync(filePath, 'utf-8');
  const ext = extname(filePath).toLowerCase();

  let script;
  if (ext === '.yaml' || ext === '.yml') {
    script = parseYaml(raw);
  } else if (ext === '.json') {
    script = JSON.parse(raw);
  } else {
    throw new Error(`Unsupported script format: ${ext} (use .yaml or .json)`);
  }

  return {
    project: { ...DEFAULTS.project, ...script.project },
    voice: { ...DEFAULTS.voice, ...script.voice },
    scenes: (script.scenes || []).map((scene, i) => ({
      name: scene.name || `scene-${String(i + 1).padStart(2, '0')}`,
      narration: scene.narration || '',
      actions: scene.actions || [],
      pauseAfter: scene.pauseAfter ?? 1500,
    })),
  };
}
