/**
 * ClawForge — Webcam Overlay Engine
 * Builds ffmpeg filter strings for picture-in-picture webcam overlay.
 *
 * Pipeline:
 *   [main] → [scale] → [circle crop?] → [border?] → overlay → [out]
 */

const VALID_POSITIONS = ['bottom-left', 'bottom-right', 'top-left', 'top-right'];

/**
 * Builds an ffmpeg filter_complex string segment for webcam PiP overlay.
 *
 * @param {object} webcamConfig — webcam config from script
 * @param {object} viewport — { width, height } of the main video
 * @param {object} [opts]
 * @param {string} [opts.mainLabel='[0:v]'] — label for the main video stream
 * @param {string} [opts.camLabel='[1:v]'] — label for the webcam input stream
 * @returns {{ filterComplex: string, videoOut: string }}
 *   filterComplex — the full filter string segment (no trailing semicolon)
 *   videoOut    — label of the final video output (e.g. '[pip_out]')
 */
export function buildWebcamOverlay(webcamConfig, viewport, opts = {}) {
  const {
    position = 'bottom-right',
    width = 320,
    height = 240,
    crop = 'rectangle',
    border = false,
    margin = 20,
  } = webcamConfig;

  const {
    mainLabel = '[0:v]',
    camLabel = '[1:v]',
  } = opts;

  const parts = [];
  const xPos = calcOverlayX(position, viewport.width, width, margin);
  const yPos = calcOverlayY(position, viewport.height, height, margin);

  // Step 1: Scale webcam to target size
  parts.push(`${camLabel}scale=${width}:${height}[cam_scaled]`);

  // Step 2: Optional circle crop via alpha channel
  let curCam = '[cam_scaled]';
  if (crop === 'circle') {
    parts.push(
      `${curCam}format=rgba,` +
      `geq=a='if(lt(pow(X-W/2,2)+pow(Y-H/2,2),pow(min(W,H)/2,2)),255,0)'` +
      `[cam_round]`
    );
    curCam = '[cam_round]';
  }

  // Step 3: Border — draw behind the overlay position
  let curMain = mainLabel;
  if (border) {
    const bw = 2; // border thickness
    parts.push(
      `${mainLabel}drawbox=` +
      `x=${xPos}:y=${yPos}:` +
      `w=${width}:h=${height}:` +
      `color=white@0.9:t=${bw}` +
      `[main_border]`
    );
    curMain = '[main_border]';
  }

  // Step 4: Overlay webcam onto main
  const outLabel = '[pip_out]';
  parts.push(`${curMain}${curCam}overlay=${xPos}:${yPos}${outLabel}`);

  return {
    filterComplex: parts.join('; '),
    videoOut: outLabel,
  };
}

/**
 * H-position for overlay.
 * @param {string} position
 * @param {number} mainW — main video width
 * @param {number} overlayW — overlay width
 * @param {number} margin
 * @returns {number} pixel x
 */
function calcOverlayX(position, mainW, overlayW, margin) {
  switch (position) {
    case 'bottom-right':
    case 'top-right':
      return mainW - overlayW - margin;
    case 'bottom-left':
    case 'top-left':
      return margin;
    default:
      return mainW - overlayW - margin;
  }
}

/**
 * V-position for overlay.
 * @param {string} position
 * @param {number} mainH — main video height
 * @param {number} overlayH — overlay height
 * @param {number} margin
 * @returns {number} pixel y
 */
function calcOverlayY(position, mainH, overlayH, margin) {
  switch (position) {
    case 'bottom-right':
    case 'bottom-left':
      return mainH - overlayH - margin;
    case 'top-right':
    case 'top-left':
      return margin;
    default:
      return mainH - overlayH - margin;
  }
}

export { calcOverlayX, calcOverlayY };
