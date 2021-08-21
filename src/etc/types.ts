import type { FaviconOptions, IconOptions } from 'favicons';
import type { DeepPartial } from 'ts-essentials';


export interface FaviconsPluginOptions extends DeepPartial<FaviconOptions> {
  /**
   * Whether to inject the HTML fragments generated by `favicons` into the
   * compilation's HTML document.
   *
   * @default `true`
   */
  inject?: boolean;

  /**
   * Whether to cache generated assets for faster subsequent builds.
   *
   * @default `true`
   */
  cache?: boolean;

  /**
   * Options for rendering different icon types. Supports the same options as
   * `favicons` with the addition of a required `source` field that points to
   * the asset to use for a given icon type.
   */
  icons: {
    [K in keyof FaviconOptions['icons']]?: IconOptions & {
      /**
       * Source image to use for this icon type.
       */
      source: string;
    }
  };
}


/**
 * Object used to describe a file emitted to a compilation.
 */
export interface EmittedFile {
  /**
   * ID assigned to the emitted file by Vite.
   */
  id: string;

  /**
   * Original file name.
   */
  name: string;

  /**
   * Name that will be used for the file in the compilation.
   */
  resolvedName: string;
}
