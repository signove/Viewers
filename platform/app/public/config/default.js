/** @type {AppTypes.Config} */

window.config = {
  name: 'config/default.js',
  routerBasename: '/proxy/teleuti/dicomViewer',
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
    createLogoComponentFn: function(React) {
      return React.createElement('div', {});
    },
  }
};
