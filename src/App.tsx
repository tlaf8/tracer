import { lazy, Suspense, useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { type Debug, type Page } from './types';
import DebugLoading from './components/DebugLoading';

const Scan = lazy(() => import('./components/Scanner'));
const Dashboard = lazy(() => import('./components/Dashboard'));

const pages: Page[] = [
    { disp: 'Back', link: '/' },
    { disp: 'Dashboard', link: '/dashboard' },
];

const App = () => {
    const [pageIdx, setPageIdx] = useState(0);

    const nextPage = () => {
        setPageIdx((prev) => (prev + 1) % pages.length);
    };

    return (
        <div className='h-screen flex flex-col text-neutral-300'>
            <nav className='flex justify-between items-center bg-neutral-900 p-2 list-none z-10'>
                <li className='p-2 text-2xl'>tracer</li>

                <li>
                    <Link to={pages[pageIdx].link} onClick={nextPage} className='flex justify-end p-2 text-lg cursor-pointer'>
                        {pages[pageIdx].disp}
                    </Link>
                </li>
            </nav>

            <div className='min-h-0 flex-1 flex flex-col bg-neutral-800'>
                <Suspense
                    fallback={
                        <div className='flex-1 flex items-center justify-center overflow-hidden opacity-5'>
                            <DebugLoading />
                        </div>
                    }
                >
                    <Routes>
                        <Route path='/' element={<Scan />} />
                        <Route path='/dashboard' element={<Dashboard />} />
                    </Routes>
                </Suspense>
            </div>

            <footer className='bg-neutral-800 text-center'>
                <p className='opacity-10 text-sm p-1'>github/tlaf8</p>
            </footer>
        </div>
    );
};

export default App;