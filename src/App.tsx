import React, {useState} from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap/dist/css/bootstrap.min.css";
import ScanPage from './components/ScanPage';

const App: React.FC = () => {
    const [homePageActive, setHomePageActive] = useState<boolean>(true);

    const switchPage = () => {
        setHomePageActive(() => !homePageActive);
    }

    return (
        <Router>
            <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top">
                <div className="container-fluid">
                    <Link className="navbar-brand font-monospace" to="/">tracer</Link>
                    <div className="collapse navbar-collapse" id="navbarNav">
                        <ul className="navbar-nav ms-auto">
                            <li className="nav-item">
                                {homePageActive ? (
                                    <Link className="nav-link" to="/link" onClick={switchPage}>Link this device</Link>
                                ) : (
                                    <Link className="nav-link" to="/" onClick={switchPage}>Back</Link>
                                )}
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>

            <Routes>
                <Route path="/" element={<ScanPage />} />
                <Route path="/link" element={<p className="text-light m-3">Coming soon</p>} />
            </Routes>
        </Router>
    );
}

export default App;
