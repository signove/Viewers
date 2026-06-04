import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const basePath = (window as any).config?.basePath || '';

// Metadata indexing can lag behind the download; retry before giving up.
const MAX_RETRIES = 20;
const RETRY_DELAY_MS = 1500;

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default function OpenLazyLoading() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    (async () => {
      const docId = params.get('docId');
      if (!docId) {
        navigate('/localbasic');
        return;
      }
      try {
        setLoading(true);

        // Existence is already checked by teleuti before opening the iframe, so we only
        // poll the metadata (404/empty while still indexing).
        let metaReady = false;

        for (let i = 0; i < MAX_RETRIES; i++) {
          if (i > 0) {
            setAttempt(i);
            // ramping backoff
            await sleep(Math.min(RETRY_DELAY_MS, 500 * i));
          }

          try {
            const metaRes = await fetch(`${basePath}dicom/studies/${docId}/metadata`, { credentials: 'include' });
            if (metaRes.ok) {
              const meta = await metaRes.json();
              if (Array.isArray(meta) && meta.length > 0) {
                metaReady = true;
                break;
              }
            }
          } catch (_) {
            // retry
          }
        }

        if (!metaReady) {
          navigate('/notfoundstudy');
          return;
        }

        // docId is used as StudyInstanceUID (getStudies returns it in 0020000D)
        const query = new URLSearchParams();
        query.append('StudyInstanceUIDs', docId);
        navigate(`/viewer?${query.toString()}`);
      } catch (error) {
        console.error(error);
        navigate('/notfoundstudy');
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate, params]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-8 w-8 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
          <p className="text-primary text-center">
            {'Preparando visualização...'}
          </p>
        </div>
      </div>
    );
  }
  return null;
}