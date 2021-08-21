import cache from 'cacache';
import findCacheDir from 'find-cache-dir';
import ssri from 'ssri';

import log from 'lib/log';


export type SsriData = string | Buffer | NodeJS.TypedArray | DataView;


export interface CacheOptions {
  logLabel?: string;
}


/**
 * Cache subdirectory in node_modules/.cache.
 */
const cachePath = findCacheDir({ name: '@darkobits/vite-plugin-favicons' });


/**
 * Returns the SHA-256 hash of the provided value.
 */
function computeKey(data: SsriData) {
  const integrity = ssri.fromData(data);
  return integrity.toString();
}


/**
 * Intended use: pass in raw file contents as key.
 * Use integrity SHA as internal key.
 * Return value if exists.
 */
async function get(key: SsriData, { logLabel }: CacheOptions) {
  if (!cachePath) {
    throw new Error('Unable to find a suitable cache directory.');
  }

  const hashKey = computeKey(key);
  const fullLogLabel = `cache:get${logLabel ? `:${logLabel}` : ''}`;

  if (logLabel) {
    log.silly(log.prefix(fullLogLabel), `Generated digest for ${log.chalk.green(logLabel)}:`, hashKey);
  }

  try {
    const result = await cache.get(cachePath, hashKey);
    const { data: cachedData } = result;

    if (logLabel) {
      log.silly(log.prefix(fullLogLabel), `Cache hit for ${logLabel}`);
    }

    return cachedData;
  } catch (err) {
    if (logLabel) {
      if (String(err.message).includes('No cache entry')) {
        log.silly(log.prefix(fullLogLabel), log.chalk.yellow('Cache miss.'));
      } else {
        log.error(log.prefix(fullLogLabel), err);
      }
    }

    return;
  }
}


/**
 * Pass in source file contents as key. Get FaviconsResponse as value.
 * Internally use sha integrity to compute key.
 */
async function put(key: SsriData, data: any, { logLabel }: CacheOptions) {
  if (!cachePath) {
    throw new Error('Unable to find a suitable cache directory.');
  }

  const hashKey = computeKey(key);
  const fullLogLabel = `cache:put:${logLabel}`;
  await cache.put(cachePath, hashKey, data);

  if (logLabel) {
    log.silly(log.prefix(fullLogLabel), log.chalk.green('Put OK.'));
  }
}


export async function clear() {
  if (!cachePath) {
    throw new Error('Unable to find a suitable cache directory.');
  }

  await cache.rm.all(cachePath);
}


export default {
  get,
  put,
  clear,
  computeKey
};
