/**
 * ClawForge — Recorder
 * Records browser interactions via Playwright with auto-debug on failure.
 */

import { chromium } from 'playwright';
import { setTimeout } from 'timers/promises';
import { mkdirSync, writeFileSync } from 'fs';
import { join, isAbsolute } from 'path';

export async function record(script, audioDurations) {
  const { project, scenes } = script;
  const videoDir = `${project.output}/video`;
  const debugDir = `${project.output}/debug`;
  mkdirSync(videoDir, { recursive: true });
  mkdirSync(debugDir, { recursive: true });

  const debugFiles = [];

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
        try {
          await executeAction(page, action, project);
        } catch (err) {
          const sceneSlug = scene.name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
          const ts = Date.now();
          const ssPath = join(debugDir, `${sceneSlug}-${action.type}-${ts}.png`);
          const htmlPath = join(debugDir, `${sceneSlug}-${action.type}-${ts}.html`);

          try {
            await page.screenshot({ path: ssPath, fullPage: true });
            const html = await page.content();
            writeFileSync(htmlPath, html, 'utf-8');
            debugFiles.push({ scene: scene.name, action: action.type, screenshot: ssPath, html: htmlPath });
          } catch (_) {
            // debug capture failed silently — don't break recording
          }

          console.warn(`  ⚠️ Action ${action.type} failed: ${err.message.split('\n')[0]}`);
          console.warn(`     📸 Debug: ${ssPath}`);
        }
      }
      const actionElapsed = Date.now() - actionStart;

      const remaining = totalMs - actionElapsed;
      if (remaining > 0) {
        await setTimeout(remaining);
      }
    }
    console.log('  ✅ Recording complete');
    if (debugFiles.length > 0) {
      console.log(`  📁 ${debugFiles.length} debug capture(s) saved to ${debugDir}/`);
    }
  } finally {
    const videoPath = await page.video()?.path();
    await page.close();
    await context.close();
    await browser.close();
    return videoPath;
  }
}

async function executeAction(page, action, project) {
  switch (action.type) {
    case 'goto':
      await page.goto(action.url, { waitUntil: 'networkidle', timeout: 30000 });
      break;

    case 'click':
      await page.locator(action.selector).first().click();
      break;

    case 'fill':
      await page.locator(action.selector).first().click();
      await page.locator(action.selector).first().fill('');
      await page.locator(action.selector).first().pressSequentially(action.text || '', { delay: 30 });
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

    case 'screenshot': {
      const filename = `${action.name || 'screenshot'}.png`;
      const screenshotDir = `${project?.output || '.'}/screenshots`;
      mkdirSync(screenshotDir, { recursive: true });
      const outPath = isAbsolute(filename) ? filename : join(screenshotDir, filename);
      await page.screenshot({ path: outPath });
      break;
    }

    default:
      console.warn(`  ⚠️ Unknown action: ${action.type}`);
  }
}
