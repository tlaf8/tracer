import React, {useState} from 'react';
import {Container, Row} from "react-bootstrap";

const LinkPage: React.FC = () => {
    const [key, setKey] = useState<string>('');
    const [status, setStatus] = useState<string>('');

    const handleConnect = () => {
        console.log('connecting')
    }

    return (
        <>
            <Container className='d-flex justify-content-center align-items-center flex-column text-light'>
                <Row className='mt-5 w-50'>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        setStatus(() => 'Connecting...');
                        handleConnect();
                    }}>
                        <div className="input-group">
                            <input
                                type="text"
                                className="form-control bg-dark-subtle rounded-start-pill p-3"
                                placeholder="Enter key"
                                value={key} onChange={(e) => { setKey(e.target.value) }}
                            />
                            <button className="btn btn-outline-secondary rounded-end-pill p-3" type="submit" id="button-addon2">Connect</button>
                        </div>
                    </form>
                </Row>
                <Row className='mt-3'>
                    <p>{status}</p>
                </Row>
            </Container>
        </>
    )
}

export default LinkPage;