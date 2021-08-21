import path from 'path';

import originalFavicons, {
  FaviconOptions,
  FaviconResponse,
  FaviconImage,
  FaviconFile,
  FaviconHtmlElement
} from 'favicons';
import fs from 'fs-extra';
import { parseFragment, Element } from 'parse5';

import { DEFAULT_ICON_OPTIONS } from 'etc/constants';
import cache from 'lib/cache';
import log from 'lib/log';

import type { EmittedFile, FaviconsPluginOptions } from 'etc/types';
// import type { DeepPartial } from 'ts-essentials';
import type { HtmlTagDescriptor } from 'vite';


/**
 * @private
 *
 * Provided a `FaviconsPluginOptions` object, returns an array of
 * [source, FaviconOptions] tuples, each representing a distinct `favicons` job
 * to run.
 */
function mapOptsToJobs(opts: FaviconsPluginOptions) {
  return Object.entries(opts.icons).map(([iconType, sourceAndIconOptions]) => {
    const { source, ...iconOptions } = sourceAndIconOptions;

    // Create a new 'icons' configuration key that contains only the current
    // icon type.
    const icons = { ...DEFAULT_ICON_OPTIONS, [iconType]: iconOptions };
    const config: Partial<FaviconOptions> = { ...opts, icons };
    return { source, iconType, config };
  });
}


/**
 * @private
 *
 * Provided an array of `FaviconResponse` objects from each job, merges them
 * into a single `FaviconResponse` object.
 */
function reduceResponses(responses: Array<FaviconResponse>) {
  return responses.reduce<FaviconResponse>((response, curResponse) => {
    for (const file of curResponse.files) {
      response.files.push(file);
    }

    for (const image of curResponse.images) {
      response.images.push(image);
    }

    for (const html of curResponse.html) {
      response.html.push(html);
    }

    return response;
  }, {
    files: [],
    images: [],
    html: []
  });
}


/**
 * @private
 *
 * Promise-based wrapper for `favicons`.
 */
async function favicons(source: string, options: FaviconOptions) {
  return new Promise<FaviconResponse>((resolve, reject) => {
    originalFavicons(source, options, (err, response) => {
      if (err) {
        reject(err);
      } else {
        resolve(response);
      }
    });
  });
}


/**
 * @private
 *
 * Caches the provided `FaviconResponse` using the provided cache key.
 *
 * Note: Because `cacache` only allows for the serialization of strings and
 * Buffers, we have to manually separate binary data from the rest of the
 * response.
 */
async function cacheResponse(iconType: string, sourcePath: string, response: FaviconResponse, label?: string) {
  const serializableResponse = {
    images: [] as Array<Omit<FaviconImage, 'contents'>>,
    files: [] as Array<Omit<FaviconFile, 'contents'>>,
    html: [] as Array<FaviconHtmlElement>
  };

  // Write images to cache as individual entities and add all other metadata to
  // the new response.
  const imagesPromise = Promise.all(response.images.map(async image => {
    const { contents, ...meta } = image;
    const key = `images/${meta.name}`;
    serializableResponse.images.push(meta);
    log.verbose(label && log.prefix(label), `Caching ${log.chalk.green(meta.name)}.`);
    await cache.put(key, contents, { logLabel: meta.name });
  }));

  // Write files to cache as individual entities and add all other metadata to
  // the new response.
  const filesPromise = Promise.all(response.files.map(async file => {
    const { contents, ...meta } = file;
    const key = `files/${meta.name}`;
    serializableResponse.files.push(meta);
    log.verbose(label && log.prefix(label), `Caching ${log.chalk.green(meta.name)}.`);
    await cache.put(key, contents, { logLabel: meta.name });
  }));

  // Add all HTML to the new response.
  for (const html of response.html) {
    serializableResponse.html.push(html);
  }

  // Serialize response and write it to cache.
  const serializedResponse = JSON.stringify(serializableResponse);

  const cacheKey = `${iconType}:${cache.computeKey(await fs.readFile(sourcePath))}`;
  const responsePromise = cache.put(cacheKey, serializedResponse, { logLabel: label });

  await Promise.all([filesPromise, imagesPromise, responsePromise]);
}


/**
 * @private
 *
 * Provided an iconType and source asset path, returns a cached FaviconResponse
 * object if one exists.
 *
 * Note: Because `cacache` only allows for the serialization of strings and
 * Buffers, we have to manually merge binary data into a single response.
 */
async function getCachedResponse(iconType: string, sourcePath: string, label?: string) {
  const cacheKey = `${iconType}:${cache.computeKey(await fs.readFile(sourcePath))}`;
  const serializedResponse = await cache.get(cacheKey, { logLabel: label });
  if (!serializedResponse) return;

  const response: FaviconResponse = JSON.parse(serializedResponse.toString('utf-8'));

  // Read all images from cache.
  const imagesPromise = Promise.all(response.images.map(async image => {
    const key = `images/${image.name}`;
    const contents = await cache.get(key, { logLabel: image.name });

    if (!contents) {
      throw new Error(`Expected cached contents for "${key}"`);
    }

    return { ...image, contents };
  }));

  // Read all files from cache.
  const filesPromise = Promise.all(response.files.map(async file => {
    const key = `files/${file.name}`;
    const contents = await cache.get(key, { logLabel: file.name });

    if (!contents) {
      throw new Error(`Expected cached contents for "${key}"`);
    }

    return { ...file, contents: contents.toString('utf-8') };
  }));

  // Wait for all assets to be read from cache.
  const [files, images] = await Promise.all([filesPromise, imagesPromise]);
  response.files = files;
  response.images = images;

  return response;
}


/**
 * Provided a FaviconsPluginOptions object, generates assets and returns a
 * FaviconResponse object.
 */
export async function generateFavicons(opts: FaviconsPluginOptions) {
  // Because favicons only allows a single source asset per invocation, map
  // incoming configuration into a list of jobs we will need to run.
  const jobConfigs = mapOptsToJobs(opts);

  const jobs = jobConfigs.map(async ({ source, iconType, config }) => {
    const sourceFileName = path.basename(source);

    if (opts.cache) {
      // If we have a cached response for this source asset, return it.
      const cachedResponse = await getCachedResponse(iconType, source, iconType);

      if (cachedResponse) {
        log.verbose(`Using cached ${log.chalk.bold(iconType)} assets from source ${log.chalk.green(sourceFileName)}.`);
        return cachedResponse;
      }
    }

    const response = await favicons(source, config as FaviconOptions);

    if (opts.cache) {
      // Return the response immediately without awaiting the cache write.
      void cacheResponse(iconType, source, response, iconType).then(() => {
        log.verbose(`Cached rendered ${log.chalk.bold(iconType)} assets from source ${log.chalk.green(sourceFileName)}.`);
      });
    }

    return response;
  });

  // Merge each response into a single `FaviconsResponse`.
  return reduceResponses(await Promise.all(jobs));
}


/**
 * Provided an array of EmittedFile objects and an array of HTML strings
 * returned by `favicons`, updates the href attributes in each <link> node to
 * contain the resolved file name produced by Vite rather than the original
 * input filename. Returns an array of HtmlTagDescriptor objects that may be
 * returned by `transformHtml`.
 *
 * See: https://vitejs.dev/guide/api-plugin.html#transformindexhtml
 */
export function parseHtml(emittedFiles: Array<EmittedFile>, fragments: Array<string>) {
  return fragments.flatMap(fragment => {
    const parsedFragment = parseFragment(fragment);

    // Map over each child node in the fragment
    return parsedFragment.childNodes.map(childNode => {
      // Then map over each of its attributes
      const mappedAttrs = (childNode as Element).attrs.map(attr => {
        // If the attribute is of type "href"
        if (attr.name === 'href') {
          // Remove any leading / from the href so it will exactly match
          // the original names of emitted files.
          const href = attr.value.replace(/^\//, '');

          // Locate the file descriptor for this element by matching our
          // href to the file's original name.
          const correspondingFile = emittedFiles.find(file => file.name === href);

          // Finally, update the href attribute from the original file name
          // to the resolved file name.
          if (correspondingFile) {
            attr.value = `/${correspondingFile.resolvedName}`;
          } else {
            throw new Error(`Unable to find a corresponding file for href: ${attr.value}`);
          }
        }

        // Return an entry tuple for this attribute name/value pair.
        return [attr.name, attr.value];
      });

      return {
        tag: childNode.nodeName,
        attrs: Object.fromEntries(mappedAttrs),
        injectTo: 'head'
      } as HtmlTagDescriptor;

    }).filter(Boolean);
  });
}
