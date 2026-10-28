import { defineConfig } from 'vitest/config';
// Emulator test files share one emulator, so files run one at a time.
export default defineConfig({ test: { environment: 'node', testTimeout: 60000, hookTimeout: 120000, fileParallelism: false } });
