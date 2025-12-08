import React, {useEffect, useState} from 'react';
import {Button, Col, Container, Modal, Row} from 'react-bootstrap';
import {Buffer} from 'buffer';
import Scanner from './Scanner';
import axios, {isAxiosError} from 'axios';

const ScanPage: React.FC = () => {
    const b64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
    const rentalRegex = /\b\w{1,6}\d{0,4}-\d+\b/;
    const [rentalId, setRentalId] = useState<string | null>(null);
    const [studentName, setStudentName] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [scanning, setScanning] = useState<boolean>(false);
    const [writing, setWriting] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const handleScan = (data: string): void => {
        if (b64Regex.test(data)) {
            setStudentName(Buffer.from(data, 'base64').toString());
        } else if (rentalRegex.test(data)) {
            setRentalId(data);
        }
    };

    const handleError = (error: string | Error): void => {
        const message = typeof error === "string" ? error : error.message;
        if (!message.includes('No QR code found')) {
            setError('Unknown error occurred with QR scanner. Check console for details');
            console.error(error);
        }
    };

    const reset = (): void => {
        setWriting(false);
        setRentalId(null);
        setStudentName(null);
        setIsModalOpen(false);
    };

    const handleSubmit = async (): Promise<void> => {
        setWriting(true);
        setError('');

        const token = localStorage.getItem('token');
        if (!token) return setError('No token found. Please link this device');
        if (!rentalId) return setError("Rental not detected");
        if (!studentName) return setError("Student not detected");

        const now = new Date();
        try {
            await axios.post(
                `/api/write`,
                {
                    rental: rentalId,
                    student: Buffer.from(studentName).toString('base64'),
                    date: now.toISOString().split("T")[0],
                    time: now.toTimeString().split(" ")[0],
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
        } catch (error) {
            if (isAxiosError(error)) {
                if (error.response?.data.error === 'rental does not exist') {
                    setError('Rental was not found, you can add it in the dashboard');
                }
            } else {
                setError('Unknown error occurred, check console for details');
                console.error(error);
            }
        }
        reset();
    }

    useEffect((): void => {
        if (rentalId && studentName && !isModalOpen) {
            setIsModalOpen(true);
        }
    }, [rentalId, studentName, isModalOpen]);

    return (
        <>
            <Container className='d-flex flex-column align-items-center'>
                <div className='p-3'>
                    <Scanner onScan={handleScan} onError={handleError} setStatus={setScanning}/>
                </div>

                <Row className='d-flex align-items-stretch justify-content-center w-75 overflow-hidden'>
                    <Col md={10} className='d-flex text-center p-3 rounded-pill bg-dark'>
                        <div className='flex-fill p-2 text-light fw-bolder border-end border-secondary'>
                            <p>Rental</p>
                            <p>
                                {scanning ? (
                                    rentalId ? rentalId : <span className='spinner-border spinner-border-sm' role='status'></span>
                                ) : (
                                    '...'
                                )}
                            </p>
                        </div>
                        <div className='flex-fill p-2 text-light fw-bolder'>
                            <p>Student</p>
                            {scanning ? (
                                studentName ? studentName : <span className='spinner-border spinner-border-sm' role='status'></span>
                            ) : (
                                '...'
                            )}
                        </div>
                    </Col>
                </Row>
                <Row>
                    {error && <p className='mt-3' style={{color: 'red', fontSize: '16px'}}>{error}</p>}
                </Row>
            </Container>

            {/*<div className='w-100 d-flex align-items-stretch justify-content-center overflow-hidden'>*/}
            {/*    <Button variant='outline-primary' onClick={mock}>*/}
            {/*        Mock*/}
            {/*    </Button>*/}
            {/*</div>*/}

            <Modal show={isModalOpen} centered data-bs-theme='dark' className='text-light'>
                <Modal.Header>
                    <Modal.Title>Confirm</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className='mt-3'>
                        <p><strong>Rental:</strong> {rentalId}</p>
                        <p><strong>Student:</strong> {studentName}</p>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    {writing && <div className='spinner-border spinner-border-sm me-3' role='status'></div>}
                    <Button variant='outline-danger' onClick={reset}>Cancel</Button>
                    <Button variant='outline-primary' disabled={writing} onClick={handleSubmit}>Confirm</Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default ScanPage;