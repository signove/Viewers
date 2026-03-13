import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MODULE_TYPES, useSystem } from '@ohif/core';
import { extensionManager } from '../../App';
import filesToStudies from './filesToStudies';

export default function OpenFromServer() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { servicesManager } = useSystem();

  useEffect(() => {
    (async () => {
      const docId = params.get('docId');
      if (!docId) {
        navigate('/localbasic');
        return;
      }

      const dataSourceModules = extensionManager.modules[MODULE_TYPES.DATA_SOURCE];
      const localDataSources = dataSourceModules.reduce((acc, curr) => {
        const mods = [];
        curr.module.forEach(mod => {
          if (mod.type === 'localApi') mods.push(mod);
        });
        return acc.concat(mods);
      }, []);

      const firstLocalDataSource = localDataSources[0];
      const dataSource = firstLocalDataSource.createDataSource({});
      const base = window.PUBLIC_URL?.replace(/\/$/, '') || '';
      console.log(`[OpenFromServer] Fetching DICOM file from server with docId: ${docId} at ${base}/teleuti/dicom/file/${encodeURIComponent(docId)}`);
      const res = await fetch(`${base}/teleuti/dicom/file/${encodeURIComponent(docId)}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        navigate('/notfoundstudy');
        return;
      }

      const blob = await res.blob();
      const filename =
        res.headers.get('content-disposition')?.match(/filename="(.+?)"/)?.[1] || `${docId}.dcm`;

      const file = new File([blob], filename, { type: 'application/dicom' });

      const studies = await filesToStudies([file], dataSource);

      if (!studies?.length) {
        navigate('/notfoundstudy');
        return;
      }

      const query = new URLSearchParams();
      studies.forEach(id => query.append('StudyInstanceUIDs', id));
      query.append('datasources', 'dicomlocal');

      navigate(`/viewer/dicomlocal?${decodeURIComponent(query.toString())}`);
    })().catch(() => {
      navigate('/notfoundstudy');
    });
  }, [navigate, params, servicesManager]);

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
      Carregando exame...
    </div>
  );
}
