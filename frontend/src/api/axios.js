import axios from 'axios';

const api = axios.create({
    baseURL: 'https://gestion-cdla.onrender.com/api'
});

export default api;