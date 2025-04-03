import React, {useState} from 'react';
import {Container, Row} from 'react-bootstrap';
import {useNavigate} from 'react-router-dom';
import axios, {isAxiosError} from 'axios';

const LinkPage: React.FC = () => {
    const [key, setKey] = useState<string>('');
    const [status, setStatus] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleConnect = async () => {
        try {
            const response = await axios.post(`http://localhost:9998/link`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({key: key})
            })

            if (response.status !== 200) {
                setError(response.data.message);
                console.log(response);
            }

            localStorage.setItem('token', response.data.token);
            setKey('');
            setStatus('Connected successfully! You will be redirected back shortly');
            setTimeout(() => {
                navigate('/');
                setStatus(null);
                setError(null);
            }, 3000)
        } catch (error) {
            if (isAxiosError(error)) {
                setError('Error: ' + error.response?.data.error);
            } else {
                setError('Unknown error occurred. Check console for details');
                console.log(error);
            }
        }
    }

    return (
        <>
            <Container className='d-flex justify-content-center align-items-center flex-column text-light'>
                <Row className='mt-5 w-50'>
                    <form onSubmit={async (e) => {
                        e.preventDefault();
                        setStatus(() => 'Connecting...');
                        setError(null);
                        await handleConnect();
                    }}>
                        <div className='input-group'>
                            <input
                                type='text'
                                className='form-control bg-dark-subtle rounded-start-pill p-3'
                                placeholder='Enter key'
                                value={key} onChange={(e) => { setKey(e.target.value) }}
                            />
                            <button className='btn btn-outline-secondary rounded-end-pill p-3' type='submit' id='button-addon2'>Connect</button>
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