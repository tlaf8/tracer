import React, {useEffect, useState} from 'react';
import {Button, Col, Container, Modal, Row} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap-icons/font/bootstrap-icons.css';
import {Buffer} from 'buffer';
import Scanner from './Scanner';
import axios from 'axios';

const ScanPage: React.FC = () => {
    const b64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    const rentalRegex = /\b\w{1,6}\d{0,4}-\d+\b/;
    const [deviceId, setDeviceId] = useState<string | null>(null);
    const [studentName, setStudentName] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [scanning, setScanning] = useState<boolean>(false);

    const handleScan = (data: string) => {
        if (b64Regex.test(data)) {
            setStudentName(Buffer.from(data, 'base64').toString());
        } else if (rentalRegex.test(data)) {
            setDeviceId(data);
        }
    };

    const handleError = (error: string | Error) => {
        if (error !== 'No QR code found') {
            console.error(error);
        }
    };

    const reset = () => {
        setDeviceId(null);
        setStudentName(null);
        setIsModalOpen(false);
    };

    const handleSubmit = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found');
            return;
        }

        if (!deviceId || !studentName) {
            console.error('Device ID or student name not set correctly');
            return;
        }

        const now = new Date();
        const response = await axios.post('http://localhost:9999/write', {
            body: {
                device: deviceId,
                student: Buffer.from(studentName).toString('base64'),
                date: now.toLocaleDateString(),
                time: now.toLocaleTimeString(),
            }
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        console.log(response);
        reset();
    };

    useEffect(() => {
        if (deviceId && studentName) {
            setIsModalOpen(true);
        }
    }, [deviceId, studentName]);

    return (
        <>
            <Container className='d-flex flex-column align-items-center'>
                <div className='p-3'>
                    <Scanner onScan={handleScan} onError={handleError} setStatus={setScanning}/>
                </div>

                <Row className='d-flex align-items-stretch justify-content-center w-75 overflow-hidden'>
                    <Col md={10} className='d-flex text-center p-3 rounded-pill bg-dark'>
                        <div className='flex-fill p-3 text-light fw-bolder border-end border-secondary'>
                            <p>Device ID</p>
                            <p>
                                {scanning ? (
                                    deviceId ? deviceId : <span className='loader'></span>
                                ) : (
                                    '...'
                                )}
                            </p>
                        </div>
                        <div className='flex-fill p-3 text-light fw-bolder'>
                            <p>Student Name</p>
                            {scanning ? (
                                studentName ? studentName : <span className='loader'></span>
                            ) : (
                                '...'
                            )}
                        </div>
                    </Col>
                </Row>
            </Container>

            <Modal show={isModalOpen} centered data-bs-theme='dark' className='text-light'>
                <Modal.Header>
                    <Modal.Title>Confirm</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className='mt-3'>
                        <p><strong>Device ID:</strong> {deviceId}</p>
                        <p><strong>Student:</strong> {studentName}</p>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant='danger' onClick={reset}>Cancel</Button>
                    <Button variant='primary' onClick={handleSubmit}>Confirm</Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default ScanPage;