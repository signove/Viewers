/**
 * Entry point for development and production PWA builds.
 */
(function () {
  const urlParams = new URLSearchParams(window.location.search);
  const _t = urlParams.get('t');
  const _s = urlParams.get('s');

  if (_t || _s) {
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url, ...args) {
      let newUrl = String(url);
      if (newUrl.includes('/dicom/')) {
        const paramsToAppend = [];
        if (_t && !newUrl.match(/[?&]t=/)) {
          paramsToAppend.push(`t=${encodeURIComponent(_t)}`);
        }
        if (_s && !newUrl.match(/[?&]s=/)) {
          paramsToAppend.push(`s=${encodeURIComponent(_s)}`);
        }
        if (paramsToAppend.length > 0) {
          const sep = newUrl.includes('?') ? '&' : '?';
          newUrl = `${newUrl}${sep}${paramsToAppend.join('&')}`;
        }
      }
      return originalOpen.call(this, method, newUrl, ...args);
    };

    const originalFetch = window.fetch;
    window.fetch = function (input, init) {
      let url = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);
      if (url.includes('/dicom/')) {
        const paramsToAppend = [];
        if (_t && !url.match(/[?&]t=/)) {
          paramsToAppend.push(`t=${encodeURIComponent(_t)}`);
        }
        if (_s && !url.match(/[?&]s=/)) {
          paramsToAppend.push(`s=${encodeURIComponent(_s)}`);
        }
        if (paramsToAppend.length > 0) {
          const sep = url.includes('?') ? '&' : '?';
          url = `${url}${sep}${paramsToAppend.join('&')}`;
        }
        if (typeof input !== 'string') {
          input = new Request(url, input instanceof Request ? input : undefined);
        } else {
          input = url;
        }
      }
      return originalFetch.call(this, input, init);
    };
  }
})();
import 'core-js/stable/global-this';
import 'regenerator-runtime/runtime';
import { createRoot } from 'react-dom/client';
import App from './App';
import React from 'react';
import 'core-js/stable';

/**
 * EXTENSIONS AND MODES
 * =================
 * pluginImports.js is dynamically generated from extension and mode
 * configuration at build time.
 *
 * pluginImports.js imports all of the modes and extensions and adds them
 * to the window for processing.
 */
import { modes as defaultModes, extensions as defaultExtensions } from './pluginImports';
import loadDynamicConfig from './loadDynamicConfig';
export { history } from './utils/history';
export { preserveQueryParameters, preserveQueryStrings } from './utils/preserveQueryParameters';

loadDynamicConfig(window.config).then(config_json => {
  // Reset Dynamic config if defined
  if (config_json !== null) {
    window.config = config_json;
  }

  /**
   * Combine our appConfiguration with installed extensions and modes.
   * In the future appConfiguration may contain modes added at runtime.
   *  */
  const appProps = {
    config: window ? window.config : {},
    defaultExtensions,
    defaultModes,
  };

  const container = document.getElementById('root');

  const root = createRoot(container);
  root.render(React.createElement(App, appProps));
});
