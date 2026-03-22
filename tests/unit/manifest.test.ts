import { describe, it, expect, beforeAll } from 'vitest';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

interface Manifest {
  manifest_version: number;
  name: string;
  version: string;
  description: string;
  permissions: string[];
  host_permissions?: string[];
  icons?: Record<string, string>;
  action?: { default_icon?: Record<string, string> };
  background: { service_worker: string };
  side_panel: { default_path: string };
  content_scripts: { matches: string[]; js: string[] }[];
  commands?: Record<string, { suggested_key?: { default: string }; description: string }>;
}

const manifestPath = resolve(import.meta.dirname, '../../.output/chrome-mv3/manifest.json');
const manifestExists = existsSync(manifestPath);

describe.skipIf(!manifestExists)('manifest.json validation', () => {
  let manifest: Manifest;

  beforeAll(async () => {
    const raw = await readFile(manifestPath, 'utf-8');
    manifest = JSON.parse(raw) as Manifest;
  });

  it('uses manifest version 3', () => {
    expect(manifest.manifest_version).toBe(3);
  });

  it('has required metadata', () => {
    expect(manifest.name).toBeTruthy();
    expect(manifest.version).toBeTruthy();
    expect(manifest.description).toBeTruthy();
  });

  it('declares required permissions', () => {
    const required = ['activeTab', 'scripting', 'storage', 'sidePanel', 'alarms', 'downloads'];
    for (const perm of required) {
      expect(manifest.permissions).toContain(perm);
    }
  });

  it('configures a background service worker', () => {
    expect(manifest.background).toBeDefined();
    expect(manifest.background.service_worker).toBeTruthy();
  });

  it('configures a side panel', () => {
    expect(manifest.side_panel).toBeDefined();
    expect(manifest.side_panel.default_path).toBeTruthy();
  });

  it('configures content scripts', () => {
    expect(manifest.content_scripts).toBeDefined();
    expect(manifest.content_scripts.length).toBeGreaterThan(0);
    const firstScript = manifest.content_scripts[0];
    expect(firstScript).toBeDefined();
    expect(firstScript?.js.length).toBeGreaterThan(0);
  });

  it('configures toggle-recording command', () => {
    expect(manifest.commands).toBeDefined();
    expect(manifest.commands!['toggle-recording']).toBeDefined();
    expect(manifest.commands!['toggle-recording']!.description).toBeTruthy();
  });

  // CWS-specific validations
  it('has icons for all required sizes (16, 32, 48, 128)', () => {
    expect(manifest.icons).toBeDefined();
    for (const size of ['16', '32', '48', '128']) {
      expect(manifest.icons![size]).toBeTruthy();
    }
  });

  it('has action.default_icon', () => {
    expect(manifest.action).toBeDefined();
    expect(manifest.action!.default_icon).toBeDefined();
  });

  it('does not declare host_permissions', () => {
    expect(manifest.host_permissions).toBeUndefined();
  });

  it('version matches semver pattern', () => {
    expect(manifest.version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
