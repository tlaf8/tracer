import React, {useEffect, useState} from 'react';
import {Container, Row} from 'react-bootstrap';
import {useNavigate} from 'react-router-dom';
import axios, {isAxiosError} from 'axios';
import urlConfig from '../urlConfig.json';

const LinkPage: React.FC = () => {
    const [key, setKey] = useState<string>('');
    const [status, setStatus] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleConnect = async (): Promise<void> => {
        try {
            const response = await axios.post(`${urlConfig.baseUrl}/api/link`, { key });
            localStorage.setItem('token', response.data.token);

            setKey(key);
            setStatus('Connected successfully! You will be redirected back shortly');

            setTimeout((): void => {
                navigate('/');
                setStatus(null);
                setError(null);
            }, 1500);
        } catch (error) {
            setStatus(null);

            if (isAxiosError(error)) {
                setError('Network error, check console for details');
                console.error(error);
            } else {
                setError('Unknown error occurred. Check console for details');
                console.error(error);
            }
        }
    }

    useEffect(() => {
        if (localStorage.getItem('token')) navigate('/');
    }, [navigate]);
    
    return (
        <>
            <Container className='d-flex justify-content-center align-items-center flex-column text-light'>
                <Row className='mt-5 w-75'>
                    <form onSubmit={async (e) => {
                        e.preventDefault();
                        setStatus('Connecting...');
                        setError(null);
                        await handleConnect();
                    }}>
                        <div className='input-group'>
                            <input
                                type='text'
                                className='form-control bg-dark-subtle rounded-start-pill p-3'
                                placeholder='Enter key'
                                value={key} onChange={(e) => { setKey(e.target.value.trimStart()) }}
                            />
                            <button className='btn btn-outline-secondary rounded-end-pill p-3' type='submit' id='button-addon2' disabled={status === 'Connecting...'}>Connect</button>
                        </div>
                    </form>
                </Row>
                <Row className='mt-3'>
                    {error && <p className='text-danger'>{error}</p>}
                    {status && <p>{status}</p>}
                </Row>
            </Container>
        </>
    )
}

export default LinkPage;