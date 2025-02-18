import React from 'react';
import {BrowserRouter as Router, Routes, Route, Link} from 'react-router-dom';
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap/dist/css/bootstrap.min.css";
import ScanPage from './components/ScanPage';

const App: React.FC = () => {
    return (
        <Router>
            <div className="collapse" id="navbarToggleExternalContent">
                <div className="bg-dark p-4 z-3">
                    <Link className='btn btn-outline-secondary rounded-pill me-3' to="/">Scan a device</Link>
                    <Link className='btn btn-outline-secondary rounded-pill' to="/link">Link a device</Link>
                </div>
            </div>
            <nav className="navbar navbar-dark bg-dark z-3">
                <div className="container-fluid">
                    <button className="navbar-toggler" type="button" data-bs-toggle="collapse"
                            data-bs-target="#navbarToggleExternalContent" aria-controls="navbarToggleExternalContent"
                            aria-expanded="false" aria-label="Toggle navigation">
                        <span className="navbar-toggler-icon"></span>
                    </button>
                </div>
            </nav>
            <Routes>
                <Route path='/' element={<ScanPage />}>Home</Route>
            </Routes>
        </Router>
    )
}

export default App;