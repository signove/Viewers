import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MODULE_TYPES, useSystem } from '@ohif/core';
import { extensionManager } from '../../App';
import filesToStudies from './filesToStudies';
import pLimit from 'p-limit';

const basePath = window.config?.basePath || '';
export default function OpenFromServer() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { servicesManager } = useSystem();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');

  useEffect(() => {
    (async () => {
      const docId = params.get('docId');
      if (!docId) {
        navigate('/localbasic');
        return;
      }

      try {
        setLoading(true);
        setStatus('Inicializando...');

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


        const folderRes = await fetch(`${basePath}dicom/folder/${encodeURIComponent(docId)}`, {
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

        const totalFiles = folderData.files.length;

        const CONCURRENCY = 10; // Máximo de downloads simultâneos
        const TIMEOUT_MS = 10000; // 10 segundos por arquivo
        const MAX_RETRIES = 2;

        const files = [];
        let downloaded = 0;
        let failedFiles = 0;

        const limit = pLimit(CONCURRENCY);

        async function downloadFile(fileName, retryCount = 0) {
          const fileUrl = `${folderData.baseUrl}/${encodeURIComponent(fileName)}`;
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

          try {
            const res = await fetch(fileUrl, {
              credentials: 'include',
              signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const blob = await res.blob();
            if (blob.size === 0) throw new Error('Empty file');

            const arrayBuffer = await blob.slice(0, 132).arrayBuffer();
            const headerBytes = new Uint8Array(arrayBuffer);
            const dicomHeader = String.fromCharCode(...headerBytes.slice(128, 132));

            if (dicomHeader !== 'DICM') {
              console.warn(`[OpenFromServer] ${fileName} não é DICOM`);
            }

            return new File([blob], fileName, { type: 'application/dicom' });

          } catch (err) {
            clearTimeout(timeoutId);

            if (err.name === 'AbortError') {
              console.warn(`[${fileName}] Timeout after ${TIMEOUT_MS}ms`);
            } else {
              console.warn(`[${fileName}] Error: ${err.message}`);
            }

            if (retryCount < MAX_RETRIES) {
              const delay = 1000 * Math.pow(2, retryCount);
              console.log(`[${fileName}] Retry ${retryCount + 1} in ${delay}ms...`);
              await new Promise(r => setTimeout(r, delay));
              return downloadFile(fileName, retryCount + 1);
            }

            return null;
          }
        }

        const downloadPromises = folderData.files.map(fileName =>
          limit(async () => {
            setStatus(`Baixando... ${Math.round((downloaded / totalFiles) * 100)}%`);

            const file = await downloadFile(fileName);

            if (file) {
              files.push(file);
            } else {
              failedFiles++;
            }

            downloaded++;
            setProgress(Math.round((downloaded / totalFiles) * 100));

            return file;
          })
        );

        await Promise.allSettled(downloadPromises);

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
        const query = new URLSearchParams();
        studies.forEach(id => {
          if (id) query.append('StudyInstanceUIDs', id);
        });
        query.append('datasources', 'dicomlocal');

        navigate(`/viewer/dicomlocal?${decodeURIComponent(query.toString())}`);

      } catch (error) {
        console.error('[OpenFromServer] Fatal error:', error);
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
