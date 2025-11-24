import Redis from "ioredis";

// TODO: Abstract to support multiple backends
type ICache = Pick<Redis, "get" | "set">;

export async function getOrSet<T>(
  cache: ICache,
  key: string,
  ttl: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = await cache.get(key);
  if (cached) {
    return JSON.parse(cached) as T;
  }

  const freshData = await fetcher();

  if (freshData) {
    await cache.set(key, JSON.stringify(freshData), "EX", ttl);
  }

  return freshData;
}
