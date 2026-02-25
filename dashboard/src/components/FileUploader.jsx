import React, { useState, useRef } from 'react';

const FileUploader = ({ onFilesUploaded, accept = ".cob,.cbl", multiple = true }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    setUploadStatus(null);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setUploadStatus({ type: 'info', message: `Uploading ${selectedFiles.length} file(s)...` });

    try {
      const results = [];
      
      for (const file of selectedFiles) {
        const text = await file.text();
        // Use Dashboard proxy instead of direct Bridge URL to avoid CORS
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            program: file.name.replace(/\.(cob|cbl)$/i, '').toUpperCase(),
            code: text
          })
        });

        if (response.ok) {
          const data = await response.json();
          results.push({
            name: file.name,
            success: true,
            data: data
          });
        } else {
          results.push({
            name: file.name,
            success: false,
            error: await response.text()
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      setUploadStatus({
        type: successCount === results.length ? 'success' : 'warning',
        message: `Successfully loaded ${successCount}/${results.length} file(s)`,
        results: results
      });

      if (onFilesUploaded) {
        onFilesUploaded(results);
      }

    } catch (error) {
      setUploadStatus({
        type: 'error',
        message: `Upload failed: ${error.message}`
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files).filter(f => 
      f.name.endsWith('.cob') || f.name.endsWith('.cbl')
    );
    
    setSelectedFiles(files);
    setUploadStatus(null);
  };

  return (
    <div style={{ marginBottom: '1rem' }}>
      <div 
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{
          border: '2px dashed var(--mainframe-green)',
          padding: '2rem',
          textAlign: 'center',
          background: 'var(--mainframe-dark)',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📁</div>
        <div style={{ color: 'var(--mainframe-green)', marginBottom: '0.5rem' }}>
          DROP COBOL FILES HERE OR CLICK TO BROWSE
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--mainframe-border)' }}>
          Supports .cob and .cbl files (multiple files allowed)
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      {selectedFiles.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <div className="panel-header" style={{ fontSize: '0.9rem' }}>
            SELECTED FILES ({selectedFiles.length})
          </div>
          <div style={{ 
            background: 'var(--mainframe-dark)', 
            padding: '1rem',
            maxHeight: '150px',
            overflowY: 'auto'
          }}>
            {selectedFiles.map((file, idx) => (
              <div key={idx} style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                padding: '0.3rem 0',
                borderBottom: idx < selectedFiles.length - 1 ? '1px solid var(--mainframe-border)' : 'none'
              }}>
                <span style={{ color: 'var(--mainframe-green)' }}>{file.name}</span>
                <span style={{ color: 'var(--mainframe-border)' }}>
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              </div>
            ))}
          </div>

          <button 
            onClick={handleUpload}
            disabled={uploading}
            className="submit-button"
            style={{ marginTop: '1rem', width: '100%' }}
          >
            {uploading ? '⏳ UPLOADING & ANALYZING...' : '⚡ UPLOAD & ANALYZE FILES'}
          </button>
        </div>
      )}

      {uploadStatus && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          background: 'var(--mainframe-dark)',
          borderLeft: `3px solid ${
            uploadStatus.type === 'success' ? 'var(--success-green)' :
            uploadStatus.type === 'error' ? 'var(--error-red)' :
            uploadStatus.type === 'warning' ? 'var(--warning-amber)' :
            'var(--modern-blue)'
          }`
        }}>
          <div style={{ 
            color: uploadStatus.type === 'success' ? 'var(--success-green)' :
                   uploadStatus.type === 'error' ? 'var(--error-red)' :
                   uploadStatus.type === 'warning' ? 'var(--warning-amber)' :
                   'var(--modern-blue)',
            fontWeight: 'bold',
            marginBottom: '0.5rem'
          }}>
            {uploadStatus.type === 'success' ? '✓ SUCCESS' :
             uploadStatus.type === 'error' ? '✗ ERROR' :
             uploadStatus.type === 'warning' ? '⚠ WARNING' : 'ℹ INFO'}
          </div>
          <div>{uploadStatus.message}</div>
          
          {uploadStatus.results && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
              {uploadStatus.results.map((result, idx) => (
                <div key={idx} style={{ 
                  color: result.success ? 'var(--success-green)' : 'var(--error-red)',
                  padding: '0.2rem 0'
                }}>
                  {result.success ? '✓' : '✗'} {result.name}
                  {result.data && ` - ${result.data.metadata?.cyclomatic_complexity || 0} complexity`}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUploader;
