import { lazy, Suspense, useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { type Debug, type Page } from './types'
import { Buffer } from 'buffer';

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
            <nav className='bg-neutral-900 flex justify-between items-center p-3 list-none z-10'>
                <li className='text-2xl'>tracer</li>

                <li>
                    <Link to={pages[pageIdx].link} onClick={nextPage} className='p-3 flex justify-end cursor-pointer'>
                        {pages[pageIdx].disp}
                    </Link>
                </li>
            </nav>

            <div className='flex-1 flex flex-col min-h-0 bg-neutral-800'>
                <Suspense
                    fallback={
                        <div className="flex-1 flex min-h-0 overflow-hidden">
                            Loading...
                        </div>
                    }
                >
                    <Routes>
                        <Route path='/' element={<Scan />} />
                        <Route path='/dashboard' element={<Dashboard />} />
                    </Routes>
                </Suspense>
            </div>
        </div>
    );
};

export default App;