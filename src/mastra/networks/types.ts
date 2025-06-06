import { Agent } from "@mastra/core/agent";
import { CoreMessage } from "@mastra/core";

/**
 * Configuration for the AgentNetwork.
 */
export interface AgentNetworkConfig {
  /**
   * Name of the network.
   */
  name: string;

  /**
   * Instructions for the routing agent that coordinates the specialized agents.
   */
  instructions: string;

  /**
   * The language model to use for the routing agent.
   */
  model: any; // Using 'any' for now to align with Agent's model type

  /**
   * An array of specialized agents that are part of the network.
   */
  agents: Agent[];
}

/**
 * Represents a single interaction within the AgentNetwork.
 */
export interface AgentInteraction {
  /**
   * The unique ID of the agent that performed the action.
   */
  agentId: string;

  /**
   * The input message or data for the agent.
   */
  input: string | CoreMessage[];

  /**
   * The output or result from the agent.
   */
  output: string;

  /**
   * The timestamp of when the interaction occurred.
   */
  timestamp: string;
}

/**
 * Options for the generate method in AgentNetwork.
 */
export interface AgentGenerateOptions {
  // Define any specific options for generation if needed in the future
}

/**
 * Options for the stream method in AgentNetwork.
 */
export interface AgentStreamOptions {
  // Define any specific options for streaming if needed in the future
} 