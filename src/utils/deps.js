/**
 * Dependency Checker
 * Checks if required external dependencies are installed
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';

const execFileAsync = promisify(execFile);

export async function checkCommand(command) {
  try {
    await execFileAsync('which', [command]);
    return { installed: true, command };
  } catch {
    return { installed: false, command };
  }
}

export async function checkPlaywright() {
  // executablePath() แค่คืนสตริง ไม่ได้เช็คไฟล์ — เคยเขียวหลอกทั้งที่ไบนารีหาย
  // (โดนจริง: cache มี 1228 แต่ playwright ตัวนี้เรียก 1223 → record ล้มทั้งก้อน)
  // เลยต้อง smoke-launch headless จริงแบบเดียวกับ recorder (headless shell โดยเฉพาะ)
  try {
    const { chromium } = await import('playwright');
    const exe = chromium.executablePath();
    if (!exe || !existsSync(exe)) {
      return {
        installed: false,
        command: 'playwright',
        message: `Chromium binary missing: ${exe || '(unknown path)'}. Run: npx --package=playwright@<your-clawforge-pinned-version> playwright install chromium`,
      };
    }
    const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    await browser.close();
    return { installed: true, command: 'playwright' };
  } catch (error) {
    return {
      installed: false,
      command: 'playwright',
      message: `Playwright browser launch failed (${error.message?.split('\n')[0] || error}). Run: npx playwright install chromium`,
    };
  }
}

export async function checkAllDependencies() {
  const [ffmpeg, ffprobe, edgeTts, playwright] = await Promise.all([
    checkCommand('ffmpeg'),
    checkCommand('ffprobe'),
    checkCommand('edge-tts'),
    checkPlaywright(),
  ]);

  const allInstalled = ffmpeg.installed && ffprobe.installed && edgeTts.installed && playwright.installed;

  return {
    allInstalled,
    dependencies: {
      ffmpeg,
      ffprobe,
      edgeTts,
      playwright,
    },
    missing: [ffmpeg, ffprobe, edgeTts, playwright]
      .filter(d => !d.installed)
      .map(d => d.command),
  };
}

export function getDependencyInstallInstructions(missing) {
  const instructions = {
    'ffmpeg': 'Install ffmpeg: https://johnvansickle.com/ffmpeg/ or use package manager',
    'ffprobe': 'Install ffmpeg (includes ffprobe): https://johnvansickle.com/ffmpeg/',
    'edge-tts': 'Install edge-tts: pip install edge-tts',
    'playwright': 'Install Playwright browsers: npx playwright install chromium',
  };

  return missing.map(dep => instructions[dep] || `Install ${dep}`);
}
