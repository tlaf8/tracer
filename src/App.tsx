import React, {useEffect, useState} from 'react'
import {Link, Route, Routes, useLocation, useNavigate} from 'react-router-dom'

const ScanPage = React.lazy(() => import('./components/ScanPage'));
const LinkPage = React.lazy(() => import('./components/LinkPage'));
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const MakeQRCode = React.lazy(() => import('./components/MakeQRCode'));


const App: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [token, setToken] = useState<string | null>(null);

    useEffect((): void => {
        const t = localStorage.getItem('token');
        if (t) setToken(t);
    }, [location.pathname])
    
    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
            }}
        >
            <nav className='navbar navbar-dark bg-dark sticky-top'>
                <div className='container-fluid'>
                    <Link className='navbar-brand font-monospace' to='/'>tracer</Link>
                    <div id='navbarNav'>
                        <ul className='navbar-nav ms-auto'>
                            <li className='nav-item' style={{ width: '10vw' }}>
                                {location.pathname === '/' ? (
                                    token ? (
                                        <Link className='nav-link float-end' to='/dashboard'>Dashboard</Link>
                                    ) : (
                                        <Link className='nav-link float-end' to='/link'>Link this device</Link>
                                    )
                                ) : (
                                    <button
                                        className="nav-link btn-secondary float-end"
                                        onClick={() => navigate(-1)}
                                    >
                                        Back
                                    </button>
                                )}
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>

            <div className='flex-grow-1'>
                <React.Suspense fallback={
                    <div className="text-center mt-5">
                        Loading...
                    </div>
                }>
                    <Routes>
                        <Route path='/' element={<ScanPage/>}/>
                        <Route path='/link' element={<LinkPage/>}/>
                        <Route path='/dashboard' element={<Dashboard/>}/>
                        <Route path='/make' element={<MakeQRCode/>}/>
                    </Routes>
                </React.Suspense>
            </div>

            <div
                style={{
                    fontSize: '0.9rem',
                    color: '#4D5154',
                    textAlign: 'center',
                    padding: '1rem',
                    marginTop: 'auto',
                }}
            >
                © 2025 github/tlaf8
            </div>
        </div>
    );
}

export default App;
