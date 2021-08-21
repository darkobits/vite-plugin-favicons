<img src="https://user-images.githubusercontent.com/441546/130305921-f51271e5-d6b8-4918-87ff-035cfd755ce7.png" style="max-width: 100%" />
<p align="center">
  <a href="https://www.npmjs.com/package/@darkobits/vite-plugin-favicons"><img src="https://img.shields.io/npm/v/@darkobits/vite-plugin-favicons.svg?style=flat-square&color=398AFB"></a>
  <a href="https://github.com/darkobits/vite-plugin-favicons/actions?query=workflow%3Aci"><img src="https://img.shields.io/github/workflow/status/darkobits/vite-plugin-favicons/ci/master?style=flat-square"></a>
  <a href="https://depfu.com/github/darkobits/vite-plugin-favicons"><img src="https://img.shields.io/depfu/darkobits/vite-plugin-favicons?style=flat-square"></a>
  <a href="https://conventionalcommits.org"><img src="https://img.shields.io/static/v1?label=commits&message=conventional&style=flat-square&color=398AFB"></a>
</p>

<br />

Yet another favicons plugin. 🤷

## Features

* Specify different source assets for each icon type (ie: `favicon.png` for favicons, `startup.png` for
  Apple startup screen, etc.).
* Rendered assets are cached to disk. Rebuilds run in ~40ms. ✨

## Install

```
npm install --save-dev @darkobits/vite-plugin-favicons
```

## Use

The plugin accepts a [`FaviconOptions`](https://github.com/itgalaxy/favicons#usage) object used to
configure [`favicons`](https://github.com/itgalaxy/favicons), with the following differences:

```js
import { defineConfig } from 'vite';
import faviconsPlugin from '@darkobits/vite-plugin-favicons';

export default defineConfig(() => ({
  plugins: [
    faviconsPlugin({
      /**
       * Whether to inject the HTML fragments generated by `favicons` into the
       * compilation's HTML document.
       *
       * @default `true`
       */
      inject: true,

      /**
       * Whether to cache generated assets for faster rebuilds.
       *
       * @default `true`
       */
      cache: true,

      // Any additional `favicons` configuration options may be used here.

      /**
       * Specify each icon type to render. Unlike `favicons`, this plugin is
       * opt-in, meaning only the icon types you declare here will be
       * rendered.
       *
       * For each icon type, all `favicons` options are supported. An
       * additional `source` property is required to indicate the asset to be
       * used for that icon type.
       */
      icons: {
        favicons: {
          source: './assets/favicon.png'
        },
        android: {
          source: './assets/android.png'
        },
        appleStartup: {
          source: './assets/apple-startup.png'
        }
        // ...etc.
      }
    })
  ]
}));
```

## Prior Art

* [`vite-plugin-favicon`](https://github.com/josh-hemphill/vite-plugin-favicon)
* [`favicons-webpack-plugin`](https://github.com/jantimon/favicons-webpack-plugin)

<br />
<a href="#top">
  <img src="https://user-images.githubusercontent.com/441546/102322726-5e6d4200-3f34-11eb-89f2-c31624ab7488.png" style="max-width: 100%;">
</a>
