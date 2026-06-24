import axios from 'axios';

const instance = axios.create({ baseURL: 'http://localhost:5002/api' });

instance.interceptors.request.use((config) => {
  if (config.baseURL && config.url && config.url.startsWith("/")) {
    config.url = config.baseURL.replace(/\/$/, "") + config.url;
    config.baseURL = ""; 
  }
  return config;
});

console.log('Result:', instance.getUri({ url: '/auth/login' }));
