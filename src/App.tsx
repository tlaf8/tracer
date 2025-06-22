import React from 'react';
import {Link, Route, Routes, useLocation, useNavigate} from 'react-router-dom';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import ScanPage from './components/ScanPage';
import LinkPage from './components/LinkPage';
import Dashboard from './components/Dashboard';
import MakeQRCode from './components/MakeQRCode.tsx'


const App: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    return (
        <>
            <nav className='navbar navbar-expand navbar-dark bg-dark sticky-top'>
                <div className='container-fluid'>
                    <Link className='navbar-brand font-monospace' to='/'>tracer</Link>
                    <div className='collapse navbar-collapse' id='navbarNav'>
                        <ul className='navbar-nav ms-auto'>
                            <li className='nav-item' style={{
                                width: '10vw',
                            }}>
                                {location.pathname === '/' ? (
                                    localStorage.getItem('token') ? (
                                        <Link className='nav-link float-end' to='/dashboard'>Dashboard</Link>
                                    ) : (
                                        <Link className='nav-link float-end' to='/link'>Link this device</Link>
                                    )
                                ) : (
                                    <p className='nav-link float-end mb-0' onClick={(): void | Promise<void> => navigate(-1)} style={{
                                        cursor: 'pointer'
                                    }}>Back</p>
                                )}
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>

            <Routes>
                <Route path='/' element={<ScanPage/>}/>
                <Route path='/link' element={<LinkPage/>}/>
                <Route path='/dashboard' element={<Dashboard/>}/>
                <Route path='/make' element={<MakeQRCode />} />
            </Routes>

            <div className='footer text-center position-fixed w-100' style={{
                fontSize: '1rem',
                bottom: '10px',
                color: '#4D5154',
            }}>
                © 2025 github/tlaf8
            </div>
        </>
    );
}

export default App;
