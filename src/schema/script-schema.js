/**
 * Script Schema Definition
 * JSON Schema for ClawForge scripts
 */

export const SCRIPT_SCHEMA = {
  type: 'object',
  required: ['scenes'],
  properties: {
    project: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          minLength: 1,
          maxLength: 100,
        },
        url: {
          type: 'string',
          format: 'uri',
        },
        output: {
          type: 'string',
          minLength: 1,
        },
        subtitles: {
          type: ['boolean', 'object'],
          default: false,
          description: 'Enable subtitle burn-in. Can be true (default style) or style config object',
          oneOf: [
            { type: 'boolean' },
            {
              type: 'object',
              properties: {
                enabled: { type: 'boolean', default: true },
                lang: { type: 'string', minLength: 2, default: 'eng' },
                fontSize: { type: 'number', minimum: 8, maximum: 72, default: 24 },
                fontColor: { type: 'string', default: 'white' },
                outlineColor: { type: 'string', default: 'black' },
                marginV: { type: 'number', minimum: 0, maximum: 200, default: 40 },
              },
              additionalProperties: false,
            },
          ],
        },
        music: {
          type: 'object',
          description: 'Background music with auto ducking during narration',
          properties: {
            file: { type: 'string', minLength: 1 },
            volume: { type: 'number', minimum: 0, maximum: 1, default: 0.3 },
            duckLevel: { type: 'number', minimum: 0, maximum: 1, default: 0.1 },
            fadeIn: { type: 'number', minimum: 0, maximum: 30, default: 2 },
            fadeOut: { type: 'number', minimum: 0, maximum: 30, default: 3 },
            loop: { type: 'boolean', default: true },
          },
          additionalProperties: false,
        },
        webcam: {
          type: 'object',
          description: 'Webcam overlay (picture-in-picture) config',
          properties: {
            file: { type: 'string', minLength: 1 },
            position: {
              type: 'string',
              enum: ['bottom-left', 'bottom-right', 'top-left', 'top-right'],
              default: 'bottom-right',
            },
            width: { type: 'number', minimum: 64, maximum: 1280, default: 320 },
            height: { type: 'number', minimum: 48, maximum: 960, default: 240 },
            crop: {
              type: 'string',
              enum: ['rectangle', 'circle'],
              default: 'rectangle',
            },
            border: { type: 'boolean', default: false },
            margin: { type: 'number', minimum: 0, maximum: 200, default: 20 },
          },
          additionalProperties: false,
        },
        viewport: {
          type: 'object',
          required: ['width', 'height'],
          properties: {
            width: {
              type: 'number',
              minimum: 320,
              maximum: 3840,
            },
            height: {
              type: 'number',
              minimum: 240,
              maximum: 2160,
            },
          },
        },
      },
    },
    voice: {
      type: 'object',
      properties: {
        engine: {
          type: 'string',
          enum: ['edge-tts'],
        },
        voice: {
          type: 'string',
          minLength: 1,
        },
        rate: {
          type: 'string',
          pattern: '^[+-]?\\d+%$',
        },
      },
    },
    scenes: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['name', 'actions'],
        properties: {
          name: {
            type: 'string',
            pattern: '^[a-z0-9-_]+$',
            minLength: 1,
            maxLength: 50,
          },
          narration: {
            type: 'string',
            maxLength: 5000,
          },
          actions: {
            type: 'array',
            minItems: 1,
            items: {
              oneOf: [
                {
                  type: 'object',
                  required: ['type', 'url'],
                  properties: {
                    type: { const: 'goto' },
                    url: { type: 'string', format: 'uri' },
                  },
                  additionalProperties: false,
                },
                {
                  type: 'object',
                  required: ['type', 'selector'],
                  properties: {
                    type: { const: 'click' },
                    selector: { type: 'string', minLength: 1 },
                  },
                  additionalProperties: false,
                },
                {
                  type: 'object',
                  required: ['type', 'selector', 'text'],
                  properties: {
                    type: { const: 'fill' },
                    selector: { type: 'string', minLength: 1 },
                    text: { type: 'string' },
                  },
                  additionalProperties: false,
                },
                {
                  type: 'object',
                  required: ['type', 'key'],
                  properties: {
                    type: { const: 'press' },
                    selector: { type: 'string' },
                    key: { type: 'string', minLength: 1 },
                  },
                  additionalProperties: false,
                },
                {
                  type: 'object',
                  required: ['type'],
                  properties: {
                    type: { const: 'scroll' },
                    y: { type: 'number' },
                    dy: { type: 'number' },
                  },
                  additionalProperties: false,
                },
                {
                  type: 'object',
                  required: ['type', 'ms'],
                  properties: {
                    type: { const: 'wait' },
                    ms: { type: 'number', minimum: 0, maximum: 60000 },
                  },
                  additionalProperties: false,
                },
                {
                  type: 'object',
                  required: ['type'],
                  properties: {
                    type: { const: 'screenshot' },
                    name: { type: 'string' },
                  },
                  additionalProperties: false,
                },
              ],
            },
          },
          pauseAfter: {
            type: 'number',
            minimum: 0,
            maximum: 10000,
          },
        },
      },
    },
  },
};

export const ACTION_TYPES = ['goto', 'click', 'fill', 'press', 'scroll', 'wait', 'screenshot'];

export const VOICE_ENGINES = ['edge-tts'];

export const COMMON_VOICES = {
  'edge-tts': [
    'en-US-AndrewMultilingualNeural',
    'en-US-AvaMultilingualNeural',
    'en-US-BrianMultilingualNeural',
    'en-US-EmmaMultilingualNeural',
    'en-GB-RyanNeural',
    'en-GB-SoniaNeural',
  ],
};
