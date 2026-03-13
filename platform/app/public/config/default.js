/** @type {AppTypes.Config} */

window.config = {
  name: 'config/default.js',
  routerBasename: '/teleuti/dicomViewer',
  showStudyList: true,
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
};
