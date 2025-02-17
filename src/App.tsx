import React, {useState} from "react";
import {Button, Col, Container, Row} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import Scanner from './components/Scanner';

const App: React.FC = () => {
    const shaRegex = /\b[0-9a-fA-F]{64}\b/;
    const rentalRegex = /\b\w{1,6}\d{0,4}-\d+\b/;
    const [deviceId, setDeviceId] = useState<string | null>(null);
    const [studentId, setStudentId] = useState<string | null>(null);

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

    const handleSubmit = () => {
        console.log("Send to backend");
        setDeviceId(null);
        setStudentId(null);
        alert('sent to backend');
    }

    return (
        <Container className="d-flex flex-column align-items-center">
            <div className="p-3">
                <Scanner onScan={handleScan} onError={handleError} />
            </div>

            <Row className="d-flex align-items-stretch justify-content-between w-75 overflow-hidden" style={{minHeight: "125px"}}>
                <Col md={5} className="text-center p-3 rounded bg-dark">
                    <p className="text-light fw-bolder">Device ID</p>
                    <p className="text-light">{deviceId ? deviceId : <span className="loader"></span>}</p>
                </Col>
                <Col md={5} className="text-center p-3 rounded bg-dark">
                    <p className="text-light fw-bolder">Student ID</p>
                    <p className="text-light">{studentId ? studentId : <span className="loader"></span>}</p>
                </Col>
            </Row>
            {deviceId && studentId && (
                <Row>
                    <Col className="mt-5">
                        <Button variant='primary' onClick={handleSubmit}>Submit</Button>
                    </Col>
                </Row>
            )}
        </Container>
    );
};

export default App;
