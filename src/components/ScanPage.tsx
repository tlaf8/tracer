import React, {useState, useEffect} from "react";
import {Button, Col, Container, Modal, Row} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import 'bootstrap-icons/font/bootstrap-icons.css';
import Scanner from './Scanner';

const ScanPage: React.FC = () => {
    const shaRegex = /\b[0-9a-fA-F]{64}\b/;
    const rentalRegex = /\b\w{1,6}\d{0,4}-\d+\b/;
    const [deviceId, setDeviceId] = useState<string | null>(null);
    const [studentId, setStudentId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [scanning, setScanning] = useState<boolean>(false);

    const handleScan = (data: string) => {
        if (shaRegex.test(data)) {
            setStudentId(data);
        } else if (rentalRegex.test(data)) {
            setDeviceId(data);
        }
    }

    const handleError = (error: string | Error) => {
        if (error !== "No QR code found") {
            console.error(error);
        }
    }

    const reset = () => {
        setDeviceId(null);
        setStudentId(null);
        setIsModalOpen(false);
    }

    const handleSubmit = () => {
        console.log("Send to backend");
        reset();
        alert('sent to backend');
    }

    useEffect(() => {
        if (deviceId && studentId) {
            setIsModalOpen(true);
        }
    }, [deviceId, studentId]);

    return (
        <>
            <Container className="d-flex flex-column align-items-center">
                <div className="p-3">
                    <Scanner onScan={handleScan} onError={handleError} setStatus={setScanning}/>
                </div>

                <Row className="d-flex align-items-stretch justify-content-center w-75 overflow-hidden">
                    <Col md={10} className="d-flex text-center p-3 rounded-pill bg-dark">
                        <div className="flex-fill p-3 text-light fw-bolder border-end border-secondary">
                            {/* Consider changing the below to set device and student to ...*/}

                            <p>Device ID</p>
                            <p>
                                {scanning ? (
                                    deviceId ? deviceId : <span className="loader"></span>
                                ) : (
                                    '...'
                                )}
                            </p>
                        </div>

                        <div className="flex-fill p-3 text-light fw-bolder">
                            <p>Student ID</p>
                            {scanning ? (
                                studentId ? studentId.substring(0, 8) + '...' : <span className="loader"></span>
                            ) : (
                                '...'
                            )}
                        </div>
                    </Col>
                </Row>
            </Container>

            <Modal show={isModalOpen} centered>
                <Modal.Header>
                    <Modal.Title>New Rental</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Device ID: {deviceId}</p>
                    <p>Student ID: {studentId?.substring(0, 32) + '...'}</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="danger" onClick={reset}>Cancel</Button>
                    <Button variant="primary" onClick={handleSubmit}>Confirm</Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default ScanPage;
