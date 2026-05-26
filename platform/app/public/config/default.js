function getBasePath() {
  const hostname = window.location.hostname;
  const isLocalDev =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.includes('ngrok') ||
    hostname.includes('localtunnel') ||
    hostname.includes('trycloudflare'); // remover essas regras pra quando for subir pra production

  if (isLocalDev) {
    return '/proxy/teleuti/';
  }

  return 'https://proxy1.integrare.life/proxy/teleuti/';
}

const urlParams = new URLSearchParams(window.location.search);
const _t = urlParams.get('t') || '';
const _s = urlParams.get('s') || '';

const dicomBase = `${getBasePath()}dicom`;
if (_t || _s) {
  console.log("_st", _t, _s);
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url, ...args) {
    let newUrl = url;
    if (typeof url === 'string' && (url.includes('proxy1.integrare.life') || url.includes('/dicom/'))) {
      const paramsToAppend = [];
      if (_t && !newUrl.match(/[?&]t=/)) {
        paramsToAppend.push(`t=${_t}`);
      }
      if (_s && !newUrl.match(/[?&]s=/)) {
        paramsToAppend.push(`s=${_s}`);
      }
      if (paramsToAppend.length > 0) {
        const separator = newUrl.includes('?') ? '&' : '?';
        newUrl += `${separator}${paramsToAppend.join('&')}`;
      }
    }
    return originalOpen.call(this, method, newUrl, ...args);
  };
}
window.config = {
  routerBasename: '/',
  basePath: getBasePath(),
  showStudyList: false,
  defaultDataSourceName: 'dicomweb',
  hangingProtocolSettings: {
    activeProtocolId: 'default',
  },
  dataSources: [
    {
      name: 'config/default.js',
      sourceName: 'dicomweb',
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      configuration: {
        name: 'DICOM Server',
        qidoRoot: dicomBase,
        wadoRoot: dicomBase,
        wadoUriRoot: `${dicomBase}/wado`,
        qidoSupportsIncludeField: false,
        supportsFuzzyMatching: false,
        supportsWildcard: false,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        requestOptions: {
          requestCredentials: 'include',
          params: {
            t: _t,
            s: _s,
          },
        },
        dicomLoaderConfig: {
          maxWebWorkers: navigator.hardwareConcurrency || 4,
        }
      },
    },
    {
      sourceName: 'dicomlocal',
      namespace: '@ohif/extension-default.dataSourcesModule.dicomlocal',
      configuration: {},
    },
  ],
  extensions: [],
  modes: [],
  whiteLabeling: { createLogoComponentFn: (React) => React.createElement('div', {}) },
};
