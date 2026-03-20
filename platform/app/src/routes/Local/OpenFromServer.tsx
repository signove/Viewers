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


        const folderRes = await fetch(`${base}/teleuti/dicom/folder/${encodeURIComponent(docId)}`, {
          credentials: 'include',
        });

        if (!folderRes.ok) {
          navigate('/notfoundstudy');
          return;
        }

        const folderData = await folderRes.json();

        if (folderData.type !== 'folder' || !folderData.files || folderData.files.length === 0) {
          navigate('/notfoundstudy');
          return;
        }

        // Download files individually
        const files = [];
        let downloaded = 0;

        for (const fileName of folderData.files) {
            const fileUrl = `${base}${folderData.baseUrl}/${encodeURIComponent(fileName)}`;

            const fileRes = await fetch(fileUrl, {
                credentials: 'include',
            });

            if (fileRes.ok) {
                const blob = await fileRes.blob();

                const arrayBuffer = await blob.slice(0, 132).arrayBuffer();
                const headerBytes = new Uint8Array(arrayBuffer);
                const dicomHeader = String.fromCharCode(...headerBytes.slice(128, 132));

                //console.log(`[OpenFromServer] Arquivo ${fileName}: tamanho=${blob.size} bytes, header DICOM="${dicomHeader}"`);

                if (dicomHeader !== 'DICM') {
                    console.warn(`[OpenFromServer] ATENÇÃO: ${fileName} não é DICOM válido! Header: "${dicomHeader}"`);
                }

                if (blob.size === 0) {
                    console.error(`[OpenFromServer] Arquivo vazio: ${fileName}`);
                    continue;
                }

                files.push(new File([blob], fileName, { type: 'application/dicom' }));
            } else {
                console.error(`[OpenFromServer] Falha ao baixar ${fileName}: status ${fileRes.status}`);
            }

            downloaded++;
            setProgress(Math.round((downloaded / folderData.files.length) * 100));
        }

        //console.log(`[OpenFromServer] ${files.length} arquivos baixados`);

        if (files.length === 0) {
          console.error('[OpenFromServer] Nenhum arquivo baixado');
          navigate('/notfoundstudy');
          return;
        }

        const studies = await filesToStudies(files, dataSource);

        if (!studies?.length) {
          console.error('[OpenFromServer] Nenhum estudo criado');
          navigate('/notfoundstudy');
          return;
        }

        //console.log(`[OpenFromServer] ${studies.length} estudos criados`);

        const query = new URLSearchParams();
        studies.forEach(id => {
          if (id) query.append('StudyInstanceUIDs', id);
        });
        query.append('datasources', 'dicomlocal');

        navigate(`/viewer/dicomlocal?${decodeURIComponent(query.toString())}`);

      } catch (error) {
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
