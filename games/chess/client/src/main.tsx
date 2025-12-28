import React from 'react';
import ReactDOM from 'react-dom/client';

// Chess Game Component (placeholder - will be migrated from client/)
function ChessGame() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif',
      background: '#1a1a2e',
      color: '#eee',
    }}>
      <h1>KROG Chess</h1>
      <p style={{ color: '#888', marginTop: '1rem' }}>
        Chess game component will be migrated here
      </p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ChessGame />
  </React.StrictMode>
);
