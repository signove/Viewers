import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const basePath = window.config?.basePath || '';

export default function OpenLazyLoading() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const docId = params.get('docId');
      if (!docId) {
        navigate('/localbasic');
        return;
      }
      try {
        setLoading(true);
        const checkRes = await fetch(`${basePath}dicom/folder/exist/${docId}`, { credentials: 'include' });
        const exists = await checkRes.json();
        if (!exists) {
          navigate('/notfoundstudy');
          return;
        }
        const metaRes = await fetch(`${basePath}dicom/studies/${docId}/metadata`, { credentials: 'include' });
        const meta = await metaRes.json();
        const studyInstanceUID = meta[0]?.['0020000D']?.Value?.[0] || docId;
        const query = new URLSearchParams();
        query.append('StudyInstanceUIDs', studyInstanceUID);
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
          <p className="text-primary text-center">Preparando visualização.</p>
        </div></div>
    );
  }
  return null;
}