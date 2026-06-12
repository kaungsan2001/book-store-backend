import redisClient from "../database/redis";

export const setCache = async ({
  key,
  exp,
  data,
}: {
  key: string;
  exp: number;
  data: any;
}): Promise<void> => {
  try {
    await redisClient.setex(key, exp, JSON.stringify(data));
    console.log(`cache set: ${key}`);
  } catch (error) {
    console.error(`redis error: ${key}`, error);
  }
};

export const getCache = async (key: string): Promise<any | null> => {
  try {
    const cache = await redisClient.get(key);

    if (cache) {
      console.log(`cache hit: ${key}`);
      return JSON.parse(cache);
    }

    console.warn(`cache miss: ${key}`);
    return null;
  } catch (error) {
    console.error(`redis error: ${key}`, error);
    return null;
  }
};
