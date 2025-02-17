import React, {useState} from "react";
import {Button, Col, Container, Row} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import CameraFeed from "./components/CameraFeed.tsx";

const App: React.FC = () => {
    const [deviceId, setDeviceId] = useState<string | null>(null);
    const [studentId, setStudentId] = useState<string | null>(null);

    return (
        <Container className="d-flex flex-column align-items-center">
            <Button variant='primary' onClick={() => setDeviceId("some id")}>update device</Button>
            <Button variant='primary' onClick={() => setStudentId("some id")}>update student</Button>
            <Button variant='primary' onClick={() => {
                setDeviceId(null);
                setStudentId(null);
            }}>reset</Button>

            <div className="p-3">
                <CameraFeed />
            </div>

            <Row className="d-flex align-items-stretch justify-content-between w-50" style={{minHeight: "125px"}}>
                <Col md={5} className="text-center p-3 rounded bg-dark">
                    <p className="text-light fw-bolder">Device ID</p>
                    <p className="text-light">{deviceId ? deviceId : <span className="loader"></span>}</p>
                </Col>
                <Col md={5} className="text-center p-3 rounded bg-dark">
                    <p className="text-light fw-bolder">Student ID</p>
                    <p className="text-light">{studentId ? studentId : <span className="loader"></span>}</p>
                </Col>
            </Row>
        </Container>
    );
};

export default App;
