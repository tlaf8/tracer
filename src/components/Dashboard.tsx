import React, {useCallback, useEffect, useState} from 'react';
import axios, {isAxiosError} from 'axios';
import {Button, Col, Container, Modal, Row, Table} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import Rental from './Rental';
import {Link} from "react-router-dom";
import Icon from "./Icon";

interface Status {
    id: number;
    rental: string;
    renter: string;
    status: string;
}

const splitIntoParts = (str: string) => {
    const parts: (string | number)[] = [];
    let current = '';

    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        const isDigit = /\d/.test(char);

        if (current === '') {
            current = char;
        } else if (/\d/.test(current[0]) === isDigit) {
            current += char;
        } else {
            parts.push(/\d/.test(current[0]) ? parseInt(current, 10) : current);
            current = char;
        }
    }

    if (current) {
        parts.push(/\d/.test(current[0]) ? parseInt(current, 10) : current);
    }

    return parts;
}

function naturalCompare(a: string, b: string): number {
    const aParts = splitIntoParts(a);
    const bParts = splitIntoParts(b);

    for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
        const aPart = aParts[i];
        const bPart = bParts[i];

        if (typeof aPart === 'number' && typeof bPart === 'number') {
            if (aPart !== bPart) {
                return aPart - bPart;
            }
        } else {
            const aStr = aPart.toString();
            const bStr = bPart.toString();
            const comparison = aStr.localeCompare(bStr);
            if (comparison !== 0) {
                return comparison;
            }
        }
    }

    return aParts.length - bParts.length;
}

const Dashboard: React.FC = () => {
    const [logs, setLogs] = useState<Array<Record<string, string>>>([]);
    const [status, setStatus] = useState<Array<Record<string, string>>>([]);
    const [hoveringStudent, setHoveringStudent] = useState<boolean>(false);
    const [rentalModalOpen, setRentalModalOpen] = useState<boolean>(false);
    const [helpModalOpen, setHelpModalOpen] = useState<boolean>(false);
    const [rentalNames, setRentalName] = useState<string>('');
    const [inputType, setInputType] = useState<string>('single');
    const [fetchingRentals, setFetchingRentals] = useState<boolean>(false);
    const [fetchingLogs, setFetchingLogs] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const reset = () => {
        setRentalName('');
        setError('');
        setFetchingRentals(false);
        setFetchingLogs(false);
        setRentalModalOpen(false);
    };

    const fetchDataCallback = useCallback(async () => {
        setFetchingRentals(true);
        setFetchingLogs(true);
        setError('');

        const token = localStorage.getItem('token');
        if (!token) {
            setError('No authentication token found. Please link this rental.');
            return;
        }

        try {
            const logsResponse = await axios.get(`https://tracer.dedyn.io/api/logs`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setLogs(logsResponse.data.logs);
            setFetchingLogs(false);

            const statusResponse = await axios.get(`https://tracer.dedyn.io/api/status`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const sortedStatus = [...statusResponse.data.status].sort((a: Status, b: Status) => {
                return naturalCompare(a.rental, b.rental);
            });

            setStatus(sortedStatus);
            setFetchingRentals(false);

        } catch (err) {
            setFetchingRentals(false);
            setFetchingLogs(false);
            if (isAxiosError(err)) {
                if (err.status === 401) {
                    localStorage.removeItem('token');
                    setError('Invalid token, please link this device again');
                } else {
                    setError(err.message);
                }
            } else {
                setError('Something went wrong, check console for details.');
                console.error(err);
            }
        }
    }, []);

    const addRental = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('No authentication token found. Please link this rental.');
            return;
        }

        if (rentalNames === '') {
            setError('Name required');
            return;
        }

        try {
            const response = await axios.post(`https://tracer.dedyn.io/api/rentals/add`, {
                body: {
                    rental: rentalNames,
                }
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log(response);
            reset();
            await fetchDataCallback();
        } catch (err) {
            if (isAxiosError(err)) {
                if (err.response?.status === 400) {
                    setError(err.response?.data.error);
                }
            } else {
                setError('Something went wrong, check console for details.');
                console.error(err);
            }
        }
    };

    const removeRental = async (rental: string) => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('No authentication token found. Please link this rental.');
            return;
        }

        try {
            const response = await axios.post('https://tracer.dedyn.io/api/rentals/remove', {
                body: {
                    rental: rental
                }
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            })

            console.log(response);
            await fetchDataCallback();
        } catch (err) {
            if (isAxiosError(err)) {
                if (err.response?.status === 404) {
                    setError(err.response?.data.error);
                }
            } else {
                setError('Something went wrong, check console for details.');
                console.error(err);
            }
        }
    }

    useEffect(() => {
        fetchDataCallback().catch(err => {
            setError('Failed fetching data. Check console for details');
            console.error(err);
        });
    }, [fetchDataCallback]);

    return (
        <>
            <Container className='mt-5 p-4 bg-dark rounded'>
                {error && <p className='text-danger'>{error}</p>}
                <Row className='mb-3'>
                    <Col>
                        <h4 className='text-white'>Logs
                            <Icon className='bi-arrow-clockwise float-end' onClick={fetchDataCallback}/>
                            <Icon className='bi bi-file-earmark-arrow-down me-2 float-end'
                                  onClick={() => alert('export csv')}/>
                            {fetchingLogs && <div className='spinner-border spinner-border-sm float-end me-2 mt-1'
                                                  role='status'></div>}
                        </h4>
                        <div className='overflow-y-auto' style={{
                            maxHeight: '30vh',
                            scrollbarWidth: 'none',
                            border: '1px solid #4D5154'
                        }}>
                            <Table striped bordered hover responsive variant='dark'>
                                <thead className='bg-dark'>
                                <tr>
                                    <th>ID</th>
                                    <th>rental</th>
                                    <th>Action</th>
                                    <th>Student</th>
                                    <th>Date</th>
                                    <th>Time</th>
                                </tr>
                                </thead>
                                <tbody>
                                {logs.map(log => (
                                    <tr key={log.id}>
                                        <td>{log.id}</td>
                                        <td>{log.rental}</td>
                                        <td>{log.action}</td>
                                        <td>{log.student}</td>
                                        <td>{log.date}</td>
                                        <td>{log.time}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </Table>
                        </div>
                    </Col>
                </Row>

                <Row>
                    <Col>
                        <h4 className='text-white'>Rentals
                            <Icon className='bi-plus float-end' onClick={() => setRentalModalOpen(true)}/>
                            {fetchingRentals && <div className='spinner-border spinner-border-sm float-end me-2 mt-1'
                                                     role='status'></div>}
                        </h4>
                        <div className='overflow-y-auto' style={{
                            maxHeight: '30vh',
                            scrollbarWidth: 'none',
                            border: '1px solid #4D5154'
                        }}>
                            <Table striped bordered hover responsive variant='dark'>
                                <thead className='bg-dark'>
                                <tr>
                                    <th>Rental</th>
                                    <th>Status</th>
                                    <th>Renter</th>
                                </tr>
                                </thead>
                                <tbody>
                                {status.map(stat => (
                                    <Rental id={stat.id} rental={stat.rental} status={stat.status} renter={stat.renter}
                                            onDelete={removeRental}/>
                                ))}
                                </tbody>
                            </Table>
                        </div>
                        <div className='float-end mt-2'
                             onMouseEnter={() => setHoveringStudent(true)}
                             onMouseLeave={() => setHoveringStudent(false)}
                        >
                            <Link to='/make' style={{
                                textDecoration: 'none',
                                color: hoveringStudent ? 'white' : '#4D5154',
                                fontSize: '0.9rem'
                            }}>Need Student QR Codes?</Link>
                        </div>
                    </Col>
                </Row>
            </Container>

            <Modal show={rentalModalOpen} centered data-bs-theme='dark' className='text-light'>
                <Modal.Header>
                    <Modal.Title style={{
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        New rental
                        <Icon className='ms-3 bi bi-info-circle' onClick={() => setHelpModalOpen(true)}/>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div>
                        <div className='table-responsive'>
                            <table className='table table-dark table-borderless'>
                                <tbody>
                                <tr>
                                    <td className='text-end align-middle' style={{width: '24%'}}>Rental name:</td>
                                    <td>
                                        {inputType === 'single' ? (
                                            <input
                                                type='text'
                                                className='form-control bg-dark text-light border-secondary'
                                                placeholder='Enter name of rental'
                                                value={rentalNames}
                                                onChange={(e) => {
                                                    setRentalName(e.target.value)
                                                }}
                                            />
                                        ) : (
                                            <textarea
                                                className='form-control bg-dark text-light border-secondary'
                                                placeholder='Enter names of rentals'
                                                value={rentalNames}
                                                onChange={(e) => {
                                                    setRentalName(e.target.value)
                                                }}
                                            ></textarea>
                                        )}
                                    </td>
                                </tr>
                                <tr>
                                    <td></td>
                                    <td className='float-end me-2 p-0'>
                                        <Icon className='bi bi-chat-left-text'
                                              onClick={() => setInputType(inputType === 'single' ? 'multi' : 'single')}/>
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer style={{width: '100%'}}>
                    <div className='d-flex flex-column' style={{width: '35%'}}>
                        <div className='d-flex justify-content-between'>
                            <Button variant='outline-danger' onClick={reset}>Cancel</Button>
                            <Button variant='outline-primary' onClick={addRental}>Confirm</Button>
                        </div>
                        <div className='mt-2'>
                            {error && <p className='m-0' style={{color: 'red'}}>Error: {error}</p>}
                        </div>
                    </div>
                </Modal.Footer>
            </Modal>

            <Modal
                size="sm"
                show={helpModalOpen}
                onHide={() => setHelpModalOpen(false)}
                data-bs-theme='dark'
                className='text-light'
                aria-labelledby="example-modal-sizes-title-sm"
            >
                <Modal.Header closeButton>
                    <Modal.Title id="example-modal-sizes-title-sm">
                        Help
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className='mb-3' style={{color: '#c4c4c4'}}>
                        <strong className='text-white'>Single Rental</strong><br/>
                        Enter the name of the rental and click 'confirm'
                    </div>
                    <div style={{color: '#c4c4c4'}}>
                        <strong className='text-white'>Multiple Rentals</strong><br/>
                        Enter each rental according to the following example:
                        <div className='ms-3'>
                            NAME-01<br/>
                            NAME-02<br/>
                            ...
                        </div>
                    </div>
                </Modal.Body>
            </Modal>
        </>
    );
};

export default Dashboard;