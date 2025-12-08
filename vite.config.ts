import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        host: '0.0.0.0',
        allowedHosts: [
            'eager-remotely-mongrel.ngrok-free.app'
        ],
        proxy: {
            "/api": "http://localhost:9998"
        }
    },
});
