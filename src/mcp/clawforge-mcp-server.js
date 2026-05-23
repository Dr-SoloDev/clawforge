/**
 * ClawForge MCP Server
 * Model Context Protocol server for AI agent integration
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ClawForgeSDK } from '../sdk/clawforge-sdk.js';
import { ClawForgeError } from '../errors/clawforge-errors.js';

export class ClawForgeMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'clawforge',
        version: '0.2.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupTools();
  }

  setupTools() {
    this.server.setRequestHandler('tools/list', async () => ({
      tools: [
        {
          name: 'clawforge_produce_video',
          description: 'Generate a demo video from a script. Automates browser recording with Playwright, voiceover generation with edge-tts, and video composition with ffmpeg. Returns the path to the generated MP4 file.',
          inputSchema: {
            type: 'object',
            required: ['script'],
            properties: {
              script: {
                oneOf: [
                  {
                    type: 'string',
                    description: 'Path to YAML script file',
                  },
                  {
                    type: 'object',
                    description: 'Script configuration object',
                    required: ['scenes'],
                    properties: {
                      project: {
                        type: 'object',
                        properties: {
                          name: { type: 'string', description: 'Project name' },
                          url: { type: 'string', description: 'Base URL to record' },
                          output: { type: 'string', description: 'Output directory' },
                          viewport: {
                            type: 'object',
                            properties: {
                              width: { type: 'number', description: 'Viewport width (default: 1280)' },
                              height: { type: 'number', description: 'Viewport height (default: 720)' },
                            },
                          },
                        },
                      },
                      voice: {
                        type: 'object',
                        properties: {
                          engine: { type: 'string', enum: ['edge-tts'], description: 'TTS engine (default: edge-tts)' },
                          voice: { type: 'string', description: 'Voice name (default: en-US-AndrewMultilingualNeural)' },
                          rate: { type: 'string', description: 'Speech rate, e.g. "+10%" or "-5%"' },
                        },
                      },
                      scenes: {
                        type: 'array',
                        description: 'Array of scenes to record',
                        items: {
                          type: 'object',
                          required: ['name', 'actions'],
                          properties: {
                            name: { type: 'string', description: 'Scene name (lowercase, alphanumeric, hyphens)' },
                            narration: { type: 'string', description: 'Voiceover text for this scene' },
                            actions: {
                              type: 'array',
                              description: 'Browser actions to perform',
                              items: {
                                type: 'object',
                                description: 'Action: goto, click, fill, press, scroll, wait, screenshot',
                              },
                            },
                            pauseAfter: { type: 'number', description: 'Pause duration after scene (ms)' },
                          },
                        },
                      },
                    },
                  },
                ],
              },
              options: {
                type: 'object',
                properties: {
                  output: {
                    type: 'string',
                    description: 'Override output directory',
                  },
                  skipDependencyCheck: {
                    type: 'boolean',
                    description: 'Skip dependency check (default: false)',
                  },
                  verbose: {
                    type: 'boolean',
                    description: 'Enable verbose logging (default: false)',
                  },
                },
              },
            },
          },
        },
        {
          name: 'clawforge_validate_script',
          description: 'Validate a ClawForge script without executing it. Checks for syntax errors, missing required fields, and invalid action types. Returns validation errors and warnings.',
          inputSchema: {
            type: 'object',
            required: ['script'],
            properties: {
              script: {
                oneOf: [
                  {
                    type: 'string',
                    description: 'Path to YAML script file',
                  },
                  {
                    type: 'object',
                    description: 'Script configuration object',
                  },
                ],
              },
            },
          },
        },
        {
          name: 'clawforge_check_dependencies',
          description: 'Check if all required dependencies are installed: ffmpeg, ffprobe, edge-tts (Python), and Playwright browsers. Returns installation status and instructions for missing dependencies.',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'clawforge_dry_run',
          description: 'Perform a dry run: validate script and check dependencies without executing. Useful for pre-flight checks before actual video production.',
          inputSchema: {
            type: 'object',
            required: ['script'],
            properties: {
              script: {
                oneOf: [
                  {
                    type: 'string',
                    description: 'Path to YAML script file',
                  },
                  {
                    type: 'object',
                    description: 'Script configuration object',
                  },
                ],
              },
            },
          },
        },
      ],
    }));

    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'clawforge_produce_video':
            return await this.handleProduceVideo(args);
          case 'clawforge_validate_script':
            return await this.handleValidateScript(args);
          case 'clawforge_check_dependencies':
            return await this.handleCheckDependencies(args);
          case 'clawforge_dry_run':
            return await this.handleDryRun(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return this.formatError(error);
      }
    });
  }

  async handleProduceVideo({ script, options = {} }) {
    const forge = new ClawForgeSDK({
      skipDependencyCheck: options.skipDependencyCheck ?? false,
      verbose: options.verbose ?? false,
    });

    const progressUpdates = [];
    const events = [];

    forge.on('progress', (data) => progressUpdates.push(data));
    forge.on('stage:start', (data) => events.push({ type: 'stage:start', ...data }));
    forge.on('stage:complete', (data) => events.push({ type: 'stage:complete', ...data }));
    forge.on('scene:start', (data) => events.push({ type: 'scene:start', ...data }));
    forge.on('scene:complete', (data) => events.push({ type: 'scene:complete', ...data }));
    forge.on('checkpoint', (data) => events.push({ type: 'checkpoint', ...data }));
    forge.on('retry', (data) => events.push({ type: 'retry', ...data }));

    try {
      const result = await forge.produce(script, options);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                outputPath: result.outputPath,
                duration: result.duration,
                stats: result.stats,
                events: events.slice(-10),
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      const clawError = error instanceof ClawForgeError ? error : ClawForgeError.fromError(error);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                error: clawError.toJSON(),
                events: events.slice(-10),
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  }

  async handleValidateScript({ script }) {
    const forge = new ClawForgeSDK({ skipDependencyCheck: true });
    const validation = await forge.validate(script);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(validation, null, 2),
        },
      ],
    };
  }

  async handleCheckDependencies() {
    const deps = await ClawForgeSDK.checkDependencies();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(deps, null, 2),
        },
      ],
    };
  }

  async handleDryRun({ script }) {
    const forge = new ClawForgeSDK({ skipDependencyCheck: true });
    const result = await forge.dryRun(script);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  formatError(error) {
    const clawError = error instanceof ClawForgeError ? error : ClawForgeError.fromError(error);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: false,
              error: clawError.toJSON(),
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('ClawForge MCP Server started');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new ClawForgeMCPServer();
  server.start().catch((error) => {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  });
}
