import { Agent } from '@mastra/core/agent';
import { CoreMessage } from '@mastra/core';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import {
  AgentNetworkConfig,
  AgentInteraction,
  AgentGenerateOptions,
  AgentStreamOptions,
} from './types';

// HACK: Assuming these types exist on the Agent namespace until exports are fixed
type GenerateTextResult = any;
type StreamTextResult = any;

/**
 * AgentNetwork provides a way to create a network of specialized agents that
 * collaborate to solve complex tasks using an LLM-based router.
 */
export class AgentNetwork {
  private routingAgent: Agent;
  private agents: Agent[];
  private interactionHistory: Record<string, AgentInteraction[]> = {};

  constructor(config: AgentNetworkConfig) {
    this.agents = config.agents;

    const transmitSchema = z.object({
      calls: z
        .array(
          z.object({
            agentName: z
              .string()
              .describe("The name of the agent to call."),
            input: z
              .string()
              .describe('The detailed input or question for the agent.'),
          }),
        )
        .describe('One or more agent calls to execute in parallel.'),
    });

    // Define the 'transmit' tool for the routing agent
    const transmitTool = createTool({
      id: 'transmit',
      description: `Send a task to a specialized agent. Use this to delegate parts of the main task. You can call multiple agents in parallel.`,
      inputSchema: transmitSchema,
      execute: async ({ context }) => {
        const { calls } = context;
        const results = await Promise.all(
          calls.map(async ({ agentName, input }) => {
            const agent = this.agents.find(a => a.name === agentName);
            if (!agent) {
              return { agentName, error: `Agent "${agentName}" not found.` };
            }
            try {
              const result = await agent.generate(input);
              this.logInteraction(agent.id, input, result.text);
              return { agentName, result: result.text };
            } catch (error: any) {
              const errorMessage = error instanceof Error ? error.message : String(error);
              this.logInteraction(agent.id, input, errorMessage);
              return { agentName, error: errorMessage };
            }
          }),
        );
        return JSON.stringify(results, null, 2);
      },
    });

    const agentInstructions = `${config.instructions}

You have access to the following specialized agents:
${config.agents
  .map(agent => `- ${agent.name}: ${agent.instructions}`)
  .join('\n')}

Use the 'transmit' tool to delegate tasks to these agents.`;

    this.routingAgent = new Agent({
      name: config.name,
      instructions: agentInstructions,
      model: config.model,
      tools: { transmit: transmitTool },
    });

    // Initialize history for each agent
    this.agents.forEach(agent => {
      this.interactionHistory[agent.id] = [];
    });
  }

  private logInteraction(agentId: string, input: string, output: string) {
    if (!this.interactionHistory[agentId]) {
      this.interactionHistory[agentId] = [];
    }
    this.interactionHistory[agentId].push({
      agentId,
      input,
      output,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Generates a response using the agent network.
   */
  async generate(
    messages: string | string[] | CoreMessage[],
    args?: AgentGenerateOptions,
  ): Promise<GenerateTextResult> {
    return this.routingAgent.generate(messages, args);
  }

  /**
   * Streams a response using the agent network.
   */
  async stream(
    messages: string | string[] | CoreMessage[],
    args?: AgentStreamOptions,
  ): Promise<StreamTextResult> {
    return this.routingAgent.stream(messages, args);
  }

  /**
   * Returns the routing agent used by the network.
   */
  getRoutingAgent(): Agent {
    return this.routingAgent;
  }

  /**
   * Returns the array of specialized agents in the network.
   */
  getAgents(): Agent[] {
    return this.agents;
  }

  /**
   * Returns the history of interactions for a specific agent.
   */
  getAgentHistory(agentId: string): AgentInteraction[] {
    return this.interactionHistory[agentId] || [];
  }

  /**
   * Returns the history of all agent interactions that have occurred in the network.
   */
  getAgentInteractionHistory(): Record<string, AgentInteraction[]> {
    return this.interactionHistory;
  }

  /**
   * Returns a formatted summary of agent interactions in chronological order.
   */
  getAgentInteractionSummary(): string {
    const allInteractions: AgentInteraction[] = Object.values(
      this.interactionHistory,
    ).flat();

    allInteractions.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    return allInteractions
      .map(interaction => {
        const agentName = this.agents.find(a => a.id === interaction.agentId)?.name || 'Unknown Agent';
        return `[${interaction.timestamp}] Agent "${agentName}"\nInput: ${interaction.input}\nOutput: ${interaction.output}`;
      })
      .join('\n\n');
  }
} 