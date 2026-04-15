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
  defaultDataSourceName: 'dicomlocal',
  extensions: [],
  modes: [],
  dataSources: [
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomlocal',
      sourceName: 'dicomlocal',
      configuration: {
        friendlyName: 'Arquivos locais (arrastar e soltar)',
      },
    },
  ],
  whiteLabeling: {
    createLogoComponentFn: function (React) {
      return React.createElement('div', {});
    },
  }
};
