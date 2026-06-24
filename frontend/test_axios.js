import axios from 'axios';

const instance = axios.create({ baseURL: '/api' });
console.log('Result 1:', instance.getUri({ url: '/auth/login' }));

const instance2 = axios.create({ baseURL: 'http://localhost:5002/api' });
console.log('Result 2:', instance2.getUri({ url: '/auth/login' }));

const instance3 = axios.create({ baseURL: '/api' });
console.log('Result 3:', instance3.getUri({ url: 'auth/login' }));
