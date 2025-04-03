import React, { useCallback, useEffect, useState } from 'react';
import axios, { isAxiosError } from 'axios';
import { Button, Col, Container, Modal, Row, Table } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

const Dashboard: React.FC = () => {
    const [logs, setLogs] = useState<Array<Record<string, string>>>([]);
    const [status, setStatus] = useState<Array<Record<string, string>>>([]);
    const [hoveringRefresh, setHoveringRefresh] = useState<boolean>(false);
    const [hoveringAdd, setHoveringAdd] = useState<boolean>(false);
    const [hoveringHelp, setHoveringHelp] = useState<boolean>(false);
    const [rentalModalOpen, setRentalModalOpen] = useState<boolean>(false);
    const [helpModalOpen, setHelpModalOpen] = useState<boolean>(false);
    const [rentalNames, setRentalName] = useState<string>('');
    const [hoveringBulk, setHoveringBulk] = useState<boolean>(false);
    const [inputType, setInputType] = useState<string>('single');
    const [error, setError] = useState<string>('');

    const reset = () => {
        setRentalName('');
        setError('');
        setRentalModalOpen(false);
    };

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('No authentication token found. Please link this rental.');
            return;
        }

        try {
            const logsResponse = await axios.get(`https://sftracer.duckdns.org/api/logs`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setLogs(logsResponse.data.logs);

            const statusResponse = await axios.get(`https://sftracer.duckdns.org/api/status`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setStatus(statusResponse.data.status);
        } catch (err) {
            if (isAxiosError(err)) {
                setError(err.response?.data);
            }
            setError('Something went wrong, check console for details.');
            console.error(err);
        }
    };

    const fetchDataCallback = useCallback(async () => {
        await fetchData();
    }, []); // Empty dependency array since fetchData doesn't depend on state/props

    useEffect(() => {
        fetchDataCallback().catch(err => {
            setError('Failed fetching data. Check console for details');
            console.error(err);
        });
    }, [fetchDataCallback]); // Run only once on mount, or when fetchDataCallback changes (it won’t due to useCallback)

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
            const response = await axios.post(`https://sftracer.duckdns.org/api/rentals/add`, {
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
            await fetchData();
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

    return (
        <>
            <Container className='mt-5 p-4 bg-dark rounded'>
                {error && <p className='text-danger'>{error}</p>}
                <Row className='mb-3'>
                    <Col>
                        <h4 className='text-white'>Logs
                            <span className='ms-3 bi-arrow-clockwise float-end' style={{
                                color: hoveringRefresh ? 'white' : '#4D5154',
                                cursor: 'pointer'
                            }}
                                  onClick={fetchData} // Manual trigger here
                                  onMouseEnter={() => setHoveringRefresh(true)}
                                  onMouseLeave={() => setHoveringRefresh(false)}>
                            </span>
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
                            <span className='ms-3 bi-plus float-end' style={{
                                color: hoveringAdd ? 'white' : '#4D5154',
                                cursor: 'pointer'
                            }}
                                  onClick={() => setRentalModalOpen(true)}
                                  onMouseEnter={() => setHoveringAdd(true)}
                                  onMouseLeave={() => setHoveringAdd(false)}>
                            </span>
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
                                </tr>
                                </thead>
                                <tbody>
                                {status.map(stat => (
                                    <tr key={stat.id}>
                                        <td>{stat.rental}</td>
                                        <td>{stat.status}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </Table>
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
                        <span className='ms-3 bi bi-info-circle ' style={{
                            color: hoveringHelp ? 'white' : '#4D5154',
                            cursor: 'pointer',
                            fontSize: '0.90rem'
                        }}
                              onClick={() => setHelpModalOpen(true)}
                              onMouseEnter={() => setHoveringHelp(true)}
                              onMouseLeave={() => setHoveringHelp(false)}>
                        </span>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className='mt-3'>
                        <div className='table-responsive'>
                            <table className='table table-dark table-borderless'>
                                <tbody>
                                <tr>
                                    <td className='text-end align-middle pe-1' style={{width: '24%'}}>Rental name:</td>
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
                                    <td className='float-end me-1'>
                                        <span className='ms-3 bi bi-chat-left-text' style={{
                                            color: hoveringBulk ? 'white' : '#4D5154',
                                            cursor: 'pointer'
                                        }}
                                              onClick={() => setInputType(inputType === 'single' ? 'multi' : 'single')}
                                              onMouseEnter={() => setHoveringBulk(true)}
                                              onMouseLeave={() => setHoveringBulk(false)}>
                                        </span>
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
                            <Button variant='danger' onClick={reset}>Cancel</Button>
                            <Button variant='primary' onClick={addRental}>Confirm</Button>
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
                        Small Modal
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className='mb-3' style={{color: '#c4c4c4'}}>
                        <strong className='text-white'>Single Rental</strong><br />
                        Enter the name of the rental and click 'confirm'
                    </div>
                    <div style={{color: '#c4c4c4'}}>
                        <strong className='text-white'>Multiple rentals</strong><br />
                        Enter each rental according to the following example:
                        <div className='ms-3'>
                            NAME-01<br />
                            NAME-02<br />
                            ...
                        </div>
                    </div>
                </Modal.Body>
            </Modal>
        </>
    );
};

export default Dashboard;