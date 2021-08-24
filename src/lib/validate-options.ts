import createValidator from '@darkobits/valida';

import type { FaviconsPluginOptions } from 'etc/types';

export default createValidator<FaviconsPluginOptions>(({ ow }) => ({
  spec: {
    inject: ow.optional.boolean,
    cache: ow.optional.boolean,
    path: ow.optional.string,
    appName: ow.optional.string,
    appShortName: ow.optional.string,
    appDescription: ow.optional.string,
    developerName: ow.optional.string,
    developerURL: ow.optional.string,
    dir: ow.optional.string,
    lang:  ow.optional.string.matches(/[a-z]{2}-[A-Z]{2}/g),
    background: ow.optional.string,
    theme_color: ow.optional.string,
    appleStatusBarStyle: ow.optional.string.oneOf([
      'black-translucent',
      'default',
      'black'
    ]),
    display: ow.optional.string.oneOf([
      'standalone',
      'fullscreen',
      'minimal-ui',
      'browser'
    ]),
    orientation: ow.optional.string.oneOf([
      'any',
      'natural',
      'portrait',
      'landscape'
    ]),
    scope: ow.optional.string,
    start_url: ow.optional.string,
    version: ow.optional.string,
    logging: ow.optional.boolean,
    pixel_art: ow.optional.boolean,
    loadManifestWithCredentials: ow.optional.boolean,
    icons: ow.object.partialShape({
      favicons: ow.optional.object.partialShape({
        source: ow.string
      }),
      android: ow.optional.object.partialShape({
        source: ow.string
      }),
      appleIcon: ow.optional.object.partialShape({
        source: ow.string
      }),
      appleStartup: ow.optional.object.partialShape({
        source: ow.string
      }),
      firefox: ow.optional.object.partialShape({
        source: ow.string
      }),
      yandex: ow.optional.object.partialShape({
        source: ow.string
      }),
      coast: ow.optional.object.partialShape({
        source: ow.string
      }),
      windows: ow.optional.object.partialShape({
        source: ow.string
      })
    })
  }
}));
