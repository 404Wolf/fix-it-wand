import nodePath from "node:path";
import XDG from "https://esm.sh/jsr/@404wolf/xdg-portable@0.1.0";
import { ensureDir } from "https://esm.sh/jsr/@std/fs@1.0.17";
import { z } from "https://esm.sh/zod@3.24.3";
import { PROGRAM_NAME } from "./consts.ts";
import logger from "./pino.ts";

export const ConfigSchema = z.object({
  wandId: z.string().optional(),
});

export type Config = z.infer<typeof ConfigSchema>;

const CONFIG_DIR = nodePath.join(XDG.config(), PROGRAM_NAME);
const CONFIG_FILE = nodePath.join(CONFIG_DIR, "config.json");

await ensureDir(CONFIG_DIR);

export function readConfig(): Config {
  try {
    const configText = Deno.readTextFileSync(CONFIG_FILE);
    const parsedConfig = JSON.parse(configText);
    const config = ConfigSchema.parse(parsedConfig);
    logger.info({ message: "Config read successfully", config });
    return config;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      logger.warn({
        message: "Config file not found, returning default config",
      });
      return {};
    }
    logger.error({ message: "Error reading config", error });
    return {};
  }
}

export function writeConfig(config: Config): void {
  try {
    Deno.writeTextFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    logger.info({ message: "Config written successfully", config });
  } catch (error) {
    logger.error({ message: "Error writing config", error });
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
