import NodeCache from 'node-cache';

const nodeCache = new NodeCache({ stdTTL: 300 });

export const getCache = <T>(key: string): T | null => {
  return nodeCache.get<T>(key) || null;
};

export const setCache = (key: string, data: unknown, ttlSeconds: number = 300): void => {
  nodeCache.set(key, data, ttlSeconds);
};

export const invalidateCache = (pattern: string): void => {
  const keys = nodeCache.keys();
  const regex = new RegExp(pattern.replace('*', '.*'));
  keys.forEach(key => {
    if (regex.test(key)) {
      nodeCache.del(key);
    }
  });
};

export const clearCache = (): void => {
  nodeCache.flushAll();
};

