import type { FaviconsPluginOptions } from 'etc/types';


export const DEFAULT_OPTIONS: Partial<FaviconsPluginOptions> = {
  inject: true,
  cache: true
};


/**
 * By default, `favicons` renders assets for each icon type and config is used
 * to opt-out. This plugin prefers an opt-in strategy, so we merge incoming
 * configuration with this object to ensure `favicons` only renders the assets
 * the user explicity declared.
 */
export const DEFAULT_ICON_OPTIONS = {
  android: false,
  appleIcon: false,
  appleStartup: false,
  coast: false,
  favicons: false,
  firefox: false,
  windows: false,
  yandex: false
};
