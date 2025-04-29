import { join } from "node:path";
import XDG from "https://esm.sh/jsr/@404wolf/xdg-portable@0.1.0";
import { ensureDir } from "https://esm.sh/jsr/@std/fs";
import { z } from "https://esm.sh/zod@3.24.3";
import { PROGRAM_NAME } from "./consts.ts";

export const ConfigSchema = z.object({
  wandId: z.string().optional(),
});

export type Config = z.infer<typeof ConfigSchema>;

const CONFIG_DIR = join(XDG.config(), PROGRAM_NAME);
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

await ensureDir(CONFIG_DIR);

export function readConfig(): Config {
  try {
    const configText = Deno.readTextFileSync(CONFIG_FILE);
    const parsedConfig = JSON.parse(configText);
    return ConfigSchema.parse(parsedConfig);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return {};
    console.error("Error reading config:", error);
    return {};
  }
}

export function writeConfig(config: Config): void {
  try {
    Deno.writeTextFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error("Error writing config:", error);
  }
}

export function updateConfig<K extends keyof Config>(
  key: K,
  value: Config[K],
): void {
  const config = readConfig();
  config[key] = value;
  writeConfig(config);
}
