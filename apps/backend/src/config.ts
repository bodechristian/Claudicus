import "dotenv/config";

function readEnv(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

export const config = {
  port: Number(readEnv("PORT", "3000")),
  dbPath: readEnv("DB_PATH", "./data/claudicus.db"),
  anthropicApiKey: readEnv("ANTHROPIC_API_KEY", "sk-ant-dummy-placeholder-REPLACE-ME"),
  anthropicModel: readEnv("ANTHROPIC_MODEL", "claude-sonnet-5"),
  nodeEnv: readEnv("NODE_ENV", "development"),
};
