import React from 'react';

const SimpleOAuthTest: React.FC = () => {
  const testDirectOAuth = async () => {
    try {
      console.log('=== SIMPLE OAUTH TEST ===');
      
      // Direct fetch without any complex setup
      const response = await fetch('http://localhost:5000/api/oauth/google/url', {
        method: 'GET',
      });
      
      console.log('Response received:', response);
      console.log('Status:', response.status);
      
      const data = await response.json();
      console.log('Data:', data);
      
      if (data.success) {
        alert('Success! Redirecting to Google...');
        window.location.href = data.authUrl;
      } else {
        alert('Error: ' + JSON.stringify(data));
      }
    } catch (error) {
      console.error('Test error:', error);
      alert('Error: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const testDirectRedirect = () => {
    // Direct redirect using your Client ID
    const clientId = '1077143105260-ruq2rhn2ue71eno57bu91jj73bl8jg3f.apps.googleusercontent.com';
    const redirectUri = encodeURIComponent('http://localhost:5000/api/oauth/google/callback');
    const scope = encodeURIComponent('openid email profile');
    
    const authUrl = `https://accounts.google.com/oauth/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
    
    console.log('Direct redirect to:', authUrl);
    window.location.href = authUrl;
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      left: '10px', 
      background: 'white', 
      padding: '20px', 
      border: '2px solid black', 
      zIndex: 9999,
      borderRadius: '8px'
    }}>
      <h3>OAuth Test Panel</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button onClick={testDirectOAuth} style={{ padding: '10px', background: '#4285f4', color: 'white', border: 'none', borderRadius: '4px' }}>
          Test API Call
        </button>
        <button onClick={testDirectRedirect} style={{ padding: '10px', background: '#34a853', color: 'white', border: 'none', borderRadius: '4px' }}>
          Direct Google Redirect
        </button>
        <p style={{ fontSize: '12px', margin: 0 }}>
          Client ID: {import.meta.env.VITE_GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET'}
        </p>
      </div>
    </div>
  );
};

export default SimpleOAuthTest;
