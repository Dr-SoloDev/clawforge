/**
 * ClawForge — Subtitle Generator
 * Generates SRT subtitle files from scene narrations + audio durations.
 * Syncs subtitles to the concatenated audio timeline (no gaps between scenes).
 */

function formatSrtTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

/**
 * Generate SRT content from scenes and their audio durations.
 * Timing is accumulated across scenes (audio-only, no pauseAfter gaps).
 *
 * @param {Array<{name: string, narration?: string}>} scenes
 * @param {number[]} durations — audio duration in seconds per scene (index-aligned)
 * @param {string} [lang='eng'] — ISO 639-2 language code (metadata only)
 * @returns {string} SRT formatted subtitle content
 */
export function generateSRT(scenes, durations, lang = 'eng') {
  let subtitleIndex = 1;
  let currentTime = 0;
  const lines = [];

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const duration = durations[i] || 0;

    if (!scene.narration || duration <= 0) {
      // No narration — no subtitle, but still advance time for sync
      // (silent scenes still consume video time)
      currentTime += Math.max(duration, 3); // match recorder.js fallback
      continue;
    }

    const startTime = currentTime;
    const endTime = currentTime + duration;

    lines.push(String(subtitleIndex));
    lines.push(`${formatSrtTime(startTime)} --> ${formatSrtTime(endTime)}`);
    lines.push(scene.narration);
    lines.push(''); // blank line between entries

    subtitleIndex++;
    currentTime = endTime;
  }

  return lines.join('\n');
}
