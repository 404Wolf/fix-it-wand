import { safeEnv, string } from "https://esm.sh/jsr/@safe-env/safe-env@0.1.7";

export default safeEnv({
  JWT_SECRET: string(),
  MASTER_EMAIL: string(),
  MASTER_BEARER: string(),
});
