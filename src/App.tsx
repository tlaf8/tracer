import React from 'react';
import {Routes, Route, Link, useLocation} from 'react-router-dom';
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap/dist/css/bootstrap.min.css";
import ScanPage from './components/ScanPage';
import LinkPage from './components/LinkPage';

const App: React.FC = () => {
    const location = useLocation();

    return (
        <>
            <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top">
                <div className="container-fluid">
                    <Link className="navbar-brand font-monospace" to="/">tracer</Link>
                    <div className="collapse navbar-collapse" id="navbarNav">
                        <ul className="navbar-nav ms-auto">
                            <li className="nav-item">
                                {location.pathname === '/link' ? (
                                    <Link className="nav-link" to="/" viewTransition>Back</Link>
                                ) : (
                                    <Link className="nav-link" to="/link" viewTransition>Link this device</Link>
                                )}
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>

            <Routes>
                <Route path="/" element={<ScanPage />} />
                <Route path="/link" element={<LinkPage />} />
            </Routes>
        </>
    );
}

export default App;
