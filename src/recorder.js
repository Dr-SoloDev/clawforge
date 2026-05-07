/**
 * AgentCast — Recorder
 * Records browser interactions via Playwright.
 */

import { chromium } from 'playwright';
import { setTimeout } from 'timers/promises';
import { mkdirSync } from 'fs';

export async function record(script, audioDurations) {
  const { project, scenes } = script;
  const videoDir = `${project.output}/video`;
  mkdirSync(videoDir, { recursive: true });

  console.log(`🎬 Recording ${scenes.length} scenes at ${project.viewport.width}x${project.viewport.height}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox'],
  });

  const context = await browser.newContext({
    viewport: project.viewport,
    recordVideo: { dir: videoDir, size: project.viewport },
  });

  const page = await context.newPage();

  try {
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const duration = audioDurations[i] || 5;
      const totalMs = (duration + scene.pauseAfter / 1000) * 1000;

      console.log(`  📍 Scene ${i + 1}/${scenes.length}: ${scene.name} (~${Math.round(totalMs / 1000)}s)`);

      const actionStart = Date.now();
      for (const action of scene.actions) {
        await executeAction(page, action);
      }
      const actionElapsed = Date.now() - actionStart;

      const remaining = totalMs - actionElapsed;
      if (remaining > 0) {
        await setTimeout(remaining);
      }
    }
    console.log('  ✅ Recording complete');
  } finally {
    const videoPath = await page.video()?.path();
    await page.close();
    await context.close();
    await browser.close();
    return videoPath;
  }
}

async function executeAction(page, action) {
  switch (action.type) {
    case 'goto':
      await page.goto(action.url, { waitUntil: 'networkidle', timeout: 30000 });
      break;

    case 'click':
      await page.locator(action.selector).first().click();
      break;

    case 'fill':
      await page.locator(action.selector).first().fill(action.text || '');
      break;

    case 'press':
      if (action.selector) {
        await page.locator(action.selector).first().press(action.key);
      } else {
        await page.keyboard.press(action.key);
      }
      break;

    case 'scroll':
      if (action.dy !== undefined) {
        await page.evaluate((dy) => window.scrollBy({ top: dy, behavior: 'smooth' }), action.dy);
      } else {
        await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'smooth' }), action.y ?? 0);
      }
      break;

    case 'wait':
      await setTimeout(action.ms || 1000);
      break;

    case 'screenshot':
      await page.screenshot({ path: `${action.name || 'screenshot'}.png` });
      break;

    default:
      console.warn(`  ⚠️ Unknown action: ${action.type}`);
  }
}
