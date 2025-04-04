import React from 'react';
import {Link, Route, Routes, useLocation} from 'react-router-dom';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import ScanPage from './components/ScanPage';
import LinkPage from './components/LinkPage';
import Dashboard from './components/Dashboard';
import MakeStudent from './components/MakeStudent'


const App: React.FC = () => {
    const location = useLocation();

    return (
        <>
            <nav className='navbar navbar-expand navbar-dark bg-dark sticky-top'>
                <div className='container-fluid'>
                    <Link className='navbar-brand font-monospace' to='/'>tracer</Link>
                    <div className='collapse navbar-collapse' id='navbarNav'>
                        <ul className='navbar-nav ms-auto'>
                            <li className='nav-item'>
                                {location.pathname === '/' ? (
                                    localStorage.getItem('token') ? (
                                        <Link className='nav-link' to='/dashboard'>Dashboard</Link>
                                    ) : (
                                        <Link className='nav-link' to='/link'>Link this rental</Link>
                                    )
                                ) : (
                                    <Link className='nav-link' to='/'>Back</Link>
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
                <Route path='/make' element={<MakeStudent />} />
            </Routes>
        </>
    );
}

export default App;
