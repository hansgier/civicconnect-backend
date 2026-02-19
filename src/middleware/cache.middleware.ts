import { Request, Response, NextFunction } from 'express';
import { getCache, setCache } from '../shared/utils/cache.js';

export const checkCache = (keyPrefix: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = `${keyPrefix}:${req.originalUrl}`;
    const cached = getCache<object>(key);

    if (cached) {
      res.set('X-Cache', 'HIT');
      res.json(cached);
      return;
    }

    res.set('X-Cache', 'MISS');

    const originalJson = res.json.bind(res);
    res.json = (body: object) => {
      setCache(key, body);
      return originalJson(body);
    };

    next();
  };
};
