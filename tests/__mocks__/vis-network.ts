import { vi } from 'vitest';

// Store event handlers for testing - shared across all instances
type EventHandler = (...args: unknown[]) => void;
const globalEventHandlers: Map<string, EventHandler[]> = new Map();

// Keep track of all Network instances for event simulation
const networkInstances: Network[] = [];

// Mock Network class with event simulation support
export class Network {
  private instanceHandlers: Map<string, EventHandler[]> = new Map();
  private selectedNodes: string[] = [];

  constructor() {
    networkInstances.push(this);
  }

  on = vi.fn((eventName: string, handler: EventHandler) => {
    // Store in instance handlers
    if (!this.instanceHandlers.has(eventName)) {
      this.instanceHandlers.set(eventName, []);
    }
    this.instanceHandlers.get(eventName)!.push(handler);
    
    // Also store in global map for static access
    if (!globalEventHandlers.has(eventName)) {
      globalEventHandlers.set(eventName, []);
    }
    globalEventHandlers.get(eventName)!.push(handler);
  });

  off = vi.fn((eventName: string, handler: EventHandler) => {
    const handlers = this.instanceHandlers.get(eventName);
    if (handlers) {
      const idx = handlers.indexOf(handler);
      if (idx >= 0) handlers.splice(idx, 1);
    }
    const globalHandlers = globalEventHandlers.get(eventName);
    if (globalHandlers) {
      const idx = globalHandlers.indexOf(handler);
      if (idx >= 0) globalHandlers.splice(idx, 1);
    }
  });

  destroy = vi.fn(() => {
    this.instanceHandlers.clear();
    const idx = networkInstances.indexOf(this);
    if (idx >= 0) networkInstances.splice(idx, 1);
  });

  getPositions = vi.fn(() => ({}));
  setOptions = vi.fn();
  fit = vi.fn();
  focus = vi.fn();
  moveTo = vi.fn();
  getScale = vi.fn(() => 1);
  unselectAll = vi.fn(() => {
    this.selectedNodes = [];
  });

  selectNodes = vi.fn((nodeIds: string[]) => {
    this.selectedNodes = nodeIds;
  });

  getSelectedNodes = vi.fn(() => [...this.selectedNodes]);

  getNodeAt = vi.fn((_position: { x: number; y: number }) => undefined as string | undefined);

  // Instance method to trigger events on this network
  triggerEvent(eventName: string, params: unknown) {
    const handlers = this.instanceHandlers.get(eventName);
    if (handlers) {
      handlers.forEach(handler => handler(params));
    }
  }

  // Static helper to simulate events on all instances (for testing)
  static simulateEvent(eventName: string, params: unknown) {
    // Trigger on all active network instances
    networkInstances.forEach(instance => {
      instance.triggerEvent(eventName, params);
    });
  }

  // Static helper to get registered event names from global handlers
  static getRegisteredEvents(): string[] {
    return Array.from(globalEventHandlers.keys());
  }

  // Static helper to clear all handlers (for test cleanup)
  static clearAllHandlers() {
    globalEventHandlers.clear();
    networkInstances.forEach(instance => {
      instance.instanceHandlers.clear();
    });
    networkInstances.length = 0;
  }
}

// Mock Options type
export type Options = Record<string, unknown>;
