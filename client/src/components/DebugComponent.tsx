import React from 'react';

const DebugComponent: React.FC = () => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  
  const testAPI = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/oauth/google/url`);
      const data = await response.json();
      console.log('API Response:', data);
      alert('API Test: ' + JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('API Error:', error);
      alert('API Error: ' + error);
    }
  };

  return (
    <div style={{ position: 'fixed', top: '10px', right: '10px', background: 'white', padding: '10px', border: '1px solid black', zIndex: 9999 }}>
      <h3>Debug OAuth</h3>
      <p>Client ID: {clientId || 'NOT FOUND'}</p>
      <p>Base URL: {baseUrl || 'NOT FOUND'}</p>
      <button onClick={testAPI}>Test API</button>
    </div>
  );
};

export default DebugComponent;
