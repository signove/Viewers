/**
 * Entry point for development and production PWA builds.
 */
import 'core-js/stable/global-this';
import 'regenerator-runtime/runtime';
import { createRoot } from 'react-dom/client';
import App from './App';
import React from 'react';

// 'core-js/stable' removed — babel.config.js already uses useBuiltIns:'usage' which injects only what's necessary.
// Pass ?s=SESSION_ID in the worker URLs so that self.location.search has the session,
// allowing the SessionAwareChunkPlugin to propagate the parameter in the sub-chunks via importScripts.
(function () {
  if (typeof window === 'undefined' || !window.Worker) return;
  try {
    var _s = new URLSearchParams(window.location.search).get('s');
    if (!_s) return;
    var _enc = encodeURIComponent(_s);
    var _origWorker = window.Worker;
    window.Worker = function (url, opts) {
      var u = typeof url === 'string' ? url : url.toString();
      if (u.indexOf('?s=') < 0 && u.indexOf('&s=') < 0 && !u.startsWith('blob:')) {
        u = u + (u.indexOf('?') >= 0 ? '&' : '?') + 's=' + _enc;
      }
      return new _origWorker(u, opts);
    };
    window.Worker.prototype = _origWorker.prototype;
  } catch (e) {
    console.warn('[session-worker-patch]', e);
  }
})();

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
