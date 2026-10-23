import "dotenv/config";

function readEnv(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set; copy .env.example to apps/backend/.env and fill it in`);
  }
  return value;
}

export const config = {
  port: Number(readEnv("PORT", "3000")),
  dbPath: readEnv("DB_PATH", "./data/claudicus.db"),
  anthropicApiKey: requireEnv("ANTHROPIC_API_KEY"),
  anthropicModel: readEnv("ANTHROPIC_MODEL", "claude-sonnet-5"),
  nodeEnv: readEnv("NODE_ENV", "development"),
};
