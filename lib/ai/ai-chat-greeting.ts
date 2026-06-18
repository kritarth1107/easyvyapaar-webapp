type GreetingPeriod = "morning" | "afternoon" | "evening" | "night";

function getGreetingPeriod(hour: number): GreetingPeriod {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

function hashSeed(...parts: string[]): number {
  return parts.reduce(
    (acc, part) =>
      acc +
      part.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0),
    0,
  );
}

function firstNameFrom(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return "there";
  return trimmed.split(/\s+/)[0] ?? trimmed;
}

function shortShopLabel(shopName?: string): string {
  if (!shopName?.trim()) return "the shop";
  const words = shopName.trim().split(/\s+/);
  if (words.length <= 2) return shopName.trim();
  return `${words[0]} ${words[1]}`;
}

const GREETINGS: Record<GreetingPeriod, string[]> = {
  morning: [
    "Good morning, {name} — shop open?",
    "Namaste {name}, aaj kya karna hai?",
    "Subah ki billing, {name}?",
    "Fresh start at {shop}, {name}?",
    "{name}, ready to check today's sales?",
  ],
  afternoon: [
    "Midday check-in, {name}?",
    "{name}, lunch ke baad kya update chahiye?",
    "Dopeher ka hisaab, {name}?",
    "What's moving at {shop}, {name}?",
    "{name}, profit ya stock dekhein?",
  ],
  evening: [
    "Shaam ka round-up, {name}?",
    "{name}, closing time chat?",
    "Evening ledger at {shop}, {name}?",
    "Aaj ka din kaisa gaya, {name}?",
    "{name}, final billing for today?",
  ],
  night: [
    "Late night ledger, {name}?",
    "{name}, still at the dukaan?",
    "Moonlit billing, {name}?",
    "One last check before close, {name}?",
    "{name}, wrapping up at {shop}?",
  ],
};

export function getPersonalizedAiGreeting(params: {
  userId: string;
  userName: string;
  shopName?: string;
}): string {
  const { userId, userName, shopName } = params;
  const now = new Date();
  const period = getGreetingPeriod(now.getHours());
  const dayKey = now.toISOString().slice(0, 10);
  const pool = GREETINGS[period];
  const template = pool[hashSeed(userId, dayKey, period) % pool.length] ?? pool[0];

  return template
    .replace(/\{name\}/g, firstNameFrom(userName))
    .replace(/\{shop\}/g, shortShopLabel(shopName));
}
