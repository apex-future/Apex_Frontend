import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import db from '../db/apex.db';

export default function ImportPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading | error
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const processFiles = async (files) => {
      try {
        for (const fileHandle of files) {
          const file = await fileHandle.getFile();
          const arrayBuffer = await file.arrayBuffer();

          const title = file.name.replace(/\.(pdf|epub)$/i, '');
          const fileType = file.type || (file.name.endsWith('.epub') ? 'application/epub+zip' : 'application/pdf');

          const bookId = await db.books.add({
            title,
            author: 'Unknown',
            fileType,
            fileSize: file.size,
            fileBlob: arrayBuffer,
            coverImage: null,
            totalPages: 0,
            uploadedAt: new Date().toISOString(),
            lastReadAt: new Date().toISOString(),
          });

          // Update with local_id
          await db.books.update(bookId, { local_id: bookId.toString() });

          // Add to sync queue
          await db.sync_queue.add({
            action: 'upload',
            tableName: 'books',
            local_id: bookId.toString(),
            payload: { 
              title, 
              file_type: fileType, 
              file_size: file.size,
              uploaded_at: new Date().toISOString()
            },
            createdAt: new Date().toISOString(),
            attempts: 0,
            status: 'pending'
          });

          // Trigger immediate sync attempt
          import('../services/syncService').then(m => m.default.triggerSync?.());

          navigate(`/reader/${bookId}`);
          return;
        }
      } catch (err) {
        console.error('Import failed:', err);
        setStatus('error');
        setErrorMsg(err.message || 'Failed to import file');
        setTimeout(() => navigate('/'), 3000);
      }
    };

    if ('launchQueue' in window) {
      window.launchQueue.setConsumer(async (launchParams) => {
        if (launchParams.files && launchParams.files.length > 0) {
          await processFiles(launchParams.files);
        } else {
          navigate('/');
        }
      });
    } else {
      // No file handling API support — redirect home
      navigate('/');
    }
  }, [navigate]);

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="text-red-500" size={32} />
          </div>
          <h2 className="text-xl font-bold text-text-primary mb-2">Import Failed</h2>
          <p className="text-text-secondary text-sm">{errorMsg}</p>
          <p className="text-text-tertiary text-xs mt-2">Redirecting to library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary">
      <div className="text-center p-8">
        <Loader2 size={48} className="animate-spin text-accent-primary mx-auto mb-4" />
        <h2 className="text-xl font-bold text-text-primary mb-1">Importing your book...</h2>
        <p className="text-text-secondary text-sm">Please wait while we set things up</p>
      </div>
    </div>
  );
}
