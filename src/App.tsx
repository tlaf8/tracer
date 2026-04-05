import { useState } from 'react';
import TokenLink from './components/TokenLink'

const App = () => {
    const [token, setToken] = useState<string | null>(null);
    const [tokenModalOpen, setTokenModalOpen] = useState<boolean>(true);

    return (
        <>
            <div className='h-screen bg-gray-800 text-gray-400'>
                {/* Nav bar */}
                <nav className='bg-gray-900 flex justify-between items-center list-none p-5'>
                    <li className='text-2xl'>tracer</li>
                    <li>
                        {!token ? (
                            <button className='text-lg' onClick={prev => setTokenModalOpen(!prev)}>Link</button>
                        ) : (
                            <button className='text-lg' onClick={() => alert('Not implemented yet')}>Dashboard</button>
                        )}
                    </li>
                </nav>
                {/* Token input modal */}
                {tokenModalOpen && (
                    <TokenLink />   
                )}
            </div>
        </>
    )
}

export default App;