// Environment configuration utility
export const config = {
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
  },
  openai: {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  },
  app: {
    name: import.meta.env.VITE_APP_NAME || 'Upload You Clips',
    maxFileSize: parseInt(import.meta.env.VITE_MAX_FILE_SIZE || '104857600'),
    supportedFormats: import.meta.env.VITE_SUPPORTED_FORMATS?.split(',') || ['mp4', 'mov', 'avi', 'mkv'],
  },
} as const;

// Helper to check if OpenAI is configured
export const isOpenAIConfigured = (): boolean => {
  return !!config.openai.apiKey;
};

// Helper to get API URL
export const getApiUrl = (endpoint: string): string => {
  return `${config.api.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
};
