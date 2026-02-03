import { vi } from 'vitest';

// Track all DataSet instances for cleanup
const dataSetInstances: DataSet[] = [];

// Mock DataSet class
export class DataSet {
  private items: unknown[] = [];

  constructor(data?: unknown[]) {
    this.items = data ?? [];
    dataSetInstances.push(this);
  }

  add = vi.fn((item: unknown) => {
    this.items.push(item);
  });

  remove = vi.fn((ids: unknown) => {
    // Actually remove items to prevent accumulation
    if (Array.isArray(ids)) {
      this.items = this.items.filter((_, i) => !ids.includes(i));
    }
  });

  update = vi.fn();
  get = vi.fn(() => this.items);
  getIds = vi.fn(() => this.items.map((_, i) => i));

  clear() {
    this.items = [];
  }

  // Static cleanup for tests
  static clearAll() {
    dataSetInstances.forEach(ds => ds.clear());
    dataSetInstances.length = 0;
  }
}
