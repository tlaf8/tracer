import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap-icons/font/bootstrap-icons.css';
import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import {BrowserRouter as Router} from 'react-router-dom';
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Router>
            <App/>
        </Router>
    </StrictMode>,
)
