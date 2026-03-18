import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MODULE_TYPES, useSystem } from '@ohif/core';
import { extensionManager } from '../../App';
import filesToStudies from './filesToStudies';

export default function OpenFromServer() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { servicesManager } = useSystem();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    (async () => {
      const docId = params.get('docId');
      if (!docId) {
        navigate('/localbasic');
        return;
      }

      try {
        setLoading(true);

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

        console.log(`[OpenFromServer] Fetching DICOM folder for docId: ${docId}`);

        const folderRes = await fetch(`${base}/teleuti/dicom/folder/${encodeURIComponent(docId)}`, {
          credentials: 'include',
        });

        if (!folderRes.ok) {
          console.error('[OpenFromServer] Failed to fetch folder');
          navigate('/notfoundstudy');
          return;
        }

        const folderData = await folderRes.json();

        if (!folderData.files || folderData.files.length === 0) {
          console.error('[OpenFromServer] No files in folder');
          navigate('/notfoundstudy');
          return;
        }

        console.log(`[OpenFromServer] Received ${folderData.files.length} files from folder`);

        const files = folderData.files.map((fileInfo, index) => {
          setProgress(Math.round(((index + 1) / folderData.files.length) * 100));

          const byteCharacters = atob(fileInfo.data);
          const byteNumbers = new Array(byteCharacters.length);

          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }

          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'application/dicom' });

          return new File([blob], fileInfo.fileName, {
            type: 'application/dicom',
            lastModified: Date.now()
          });
        });


        const studies = await filesToStudies(files, dataSource);

        if (!studies?.length) {
          console.error('[OpenFromServer] No studies created from files');
          navigate('/notfoundstudy');
          return;
        }


        const query = new URLSearchParams();
        studies.forEach(id => {
          if (id) query.append('StudyInstanceUIDs', id);
        });
        query.append('datasources', 'dicomlocal');

        navigate(`/viewer/dicomlocal?${decodeURIComponent(query.toString())}`);

      } catch (error) {
        console.error('[OpenFromServer] Error loading DICOM folder:', error);
        navigate('/notfoundstudy');
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate, params, servicesManager]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="bg-muted border-primary/60 mx-auto space-y-4 rounded-xl border border-dashed py-12 px-12 drop-shadow-md">
          <p className="text-primary text-center text-xl">Carregando exame DICOM...</p>
          {progress > 0 && (
            <div className="w-64">
              <div className="bg-muted-foreground/20 h-2 w-full rounded-full">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-muted-foreground mt-2 text-center text-sm">
                {progress}% concluído
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <div className="bg-muted border-primary/60 mx-auto space-y-2 rounded-xl border border-dashed py-12 px-12 drop-shadow-md">
        <p className="text-primary text-center">Preparando visualização...</p>
      </div>
    </div>
  );
}
