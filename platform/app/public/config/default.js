/** @type {AppTypes.Config} */

function getBasePath() {
  var baseUrl = window.location.pathname.split("/").slice(0, -2).join("/") + "/";
  return baseUrl;
}

window.config = {
  name: 'config/default.js',
  routerBasename: getBasePath() + "dicomViewer",
  basePath: getBasePath(),
  showStudyList: false,
  investigationalUseDialog: {
    option: 'never',
  },
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
        qidoRoot: `${getBasePath()}dicom`,
        wadoRoot: `${getBasePath()}dicom`,
        wadoUriRoot: `${getBasePath()}dicom/wado`,
        qidoSupportsIncludeField: false,
        supportsFuzzyMatching: false,
        supportsWildcard: false,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        //useSinglePartWADO: true,
        requestOptions: {
          requestCredentials: 'include',
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