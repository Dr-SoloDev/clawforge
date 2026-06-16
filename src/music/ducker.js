/**
 * ClawForge — Audio Ducking Engine
 * Builds ffmpeg filter strings for background music ducking during narration
 */

const GAP_MS = 1500; // Must match composer.js gap

/**
 * Build narration timeline segments from scenes and audio durations
 * Returns array of { start, end } segments where narration is active
 *
 * @param {Array} scenes — scene definitions
 * @param {number[]} audioDurations — per-scene audio durations in seconds
 * @returns {{ start: number, end: number }[]}
 */
export function buildNarrationTimeline(scenes, audioDurations) {
  const segments = [];
  let cursor = 0;

  scenes.forEach((scene, i) => {
    if (scene.narration && (audioDurations[i] || 0) > 0) {
      const dur = audioDurations[i];
      segments.push({
        start: cursor,
        end: cursor + dur,
      });
      cursor += dur + (GAP_MS / 1000);
    } else if (scene.narration) {
      // Scene has narration text but no recorded duration
      cursor += GAP_MS / 1000;
    } else {
      // Scene without narration — just advance past pause
      cursor += GAP_MS / 1000;
    }
  });

  return segments;
}

/**
 * Build ffmpeg audio filter for volume ducking.
 * Output label: [bgm_ducked]
 *
 * @param {{ start: number, end: number }[]} segments — narration timeline
 * @param {number} duckLevel — volume level during narration (0–1)
 * @returns {string} ffmpeg filter string
 */
export function buildDuckingFilter(segments, duckLevel = 0.1) {
  if (!segments || segments.length === 0) {
    return '[1:a]acopy[bgm_ducked]';
  }

  const enableExpr = segments
    .map(s => `between(t,${s.start},${s.end})`)
    .join('+');

  if (!enableExpr) {
    return '[1:a]acopy[bgm_ducked]';
  }

  return `[1:a]volume=enable='${enableExpr}':volume=${duckLevel}[bgm_ducked]`;
}

/**
 * Calculate total video duration from scenes and audio durations
 *
 * @param {Array} scenes
 * @param {number[]} audioDurations
 * @returns {number} total duration in seconds
 */
export function calculateTotalDuration(scenes, audioDurations) {
  let total = 0;
  scenes.forEach((scene, i) => {
    if (scene.narration && (audioDurations[i] || 0) > 0) {
      total += audioDurations[i];
    }
    total += GAP_MS / 1000;
  });
  // Subtract trailing gap (no gap after last scene)
  if (total > 0) {
    total -= GAP_MS / 1000;
  }
  return Math.max(0, total);
}
