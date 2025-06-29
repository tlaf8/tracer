import React, {useCallback, useEffect, useState} from 'react';
import axios, {isAxiosError} from 'axios';
import {Button, Col, Container, Modal, Row, Table} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import Rental from './Rental';
import {Link} from 'react-router-dom';
import Icon from './Icon';

interface Status {
    id: number;
    rental: string;
    renter: string;
    status: string;
}

const splitIntoParts = (str: string): (string | number)[] => {
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

const naturalCompare = (a: string, b: string): number => {
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
    const [clearModalOpen, setClearModalOpen] = useState<boolean>(false);
    const [fetchingRentals, setFetchingRentals] = useState<boolean>(false);
    const [fetchingLogs, setFetchingLogs] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [rawString, setRawString] = useState<string>('');
    const [rentalList, setRentalList] = useState<Array<string>>([]);

    const reset = (): void => {
        setError('');
        setFetchingRentals(false);
        setFetchingLogs(false);
        setRentalModalOpen(false);
    };

    const addRental = async (): Promise<void> => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('No authentication token found. Please link this rental.');
            return;
        }

        if (rentalList.length === 0) {
            setError('Name required');
            return;
        }

        try {
            await axios.post(`https://tracer.dedyn.io/api/rentals/add`, {
                body: {
                    rentals: rentalList,
                }
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

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

    const removeRental = async (rental: string): Promise<void> => {
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

    const exportCsv = async (): Promise<void> => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('No authentication token found. Please link this rental.');
            return;
        }

        try {
            const response = await axios.get('https://tracer.dedyn.io/api/export', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                responseType: 'json'
            });

            if (!response.data || !response.data.csv) {
                setError('No data to export');
                return;
            }

            const filename = response.data?.headers?.['Content-Disposition']?.split('filename=')[1]?.replace(/'/g, '') || 'logs.csv';
            const blob = new Blob([response.data.csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');

            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            // link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            setClearModalOpen(true);
        } catch (err) {
            setError('Cannot export data to CSV. Please try again.');
            console.error('Export error:', err);
        }
    };

    const clearLogs = async (): Promise<void> => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('No authentication token found. Please link this rental.');
        }

        try {
            await axios.get('https://tracer.dedyn.io/api/clear', {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            setClearModalOpen(false);
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

    const onDelete = (index: number): void => {
        const newList = [...rentalList];
        newList.splice(index, 1);
        setRentalList(newList);
   }

    const fetchDataCallback = useCallback(async (): Promise<void> => {
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

    useEffect((): void => {
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
                                  onClick={(): Promise<void> => exportCsv()}/>
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
                            <Icon className='bi-plus float-end' onClick={(): void => setRentalModalOpen(true)}/>
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
                             onMouseEnter={(): void => setHoveringStudent(true)}
                             onMouseLeave={(): void => setHoveringStudent(false)}
                        >
                            <Link to='/make' style={{
                                textDecoration: 'none',
                                color: hoveringStudent ? 'white' : '#4D5154',
                                fontSize: '0.9rem'
                            }}>Create QR Codes</Link>
                        </div>
                    </Col>
                </Row>
            </Container>

            <Modal show={rentalModalOpen} data-bs-theme='dark' className='text-light'>
                <Modal.Header>
                    <Modal.Title style={{
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        New rental
                        <Icon className='ms-3 bi bi-info-circle' onClick={(): void => setHelpModalOpen(true)}/>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div>
                        <div>
                            Enter new name of device:
                        </div>
                        <div className='mt-3'>
                            <input
                            className='form-control bg-dark text-light border-secondary'
                            value={rawString}
                            onChange={(e) => {
                                setRawString(e.target.value);
                            }}
                            onKeyDown={(k) => {
                                const trimmed = rawString.trim();
                                if (k.key === 'Enter' && trimmed !== '') {
                                    setRentalList([...rentalList, trimmed]);
                                    setRawString('');
                                }
                            }}
                            ></input>
                            <div className='mt-3' style={{
                                maxHeight: '50vh',
                                overflow: 'scroll',
                            }}>
                                {rentalList.map((item, i) => (
                                    <div className='p-2 mt-1 d-flex flex-row justify-content-between' key={i} style={{
                                        border: '1px solid #4D5154',
                                        borderRadius: 'var(--bs-border-radius)'
                                    }}>
                                        <div style={{ maxWidth: '90%', textOverflow: 'ellipsis', overflow: 'hidden'}}>{item}</div>
                                        <Icon className='bi bi-x float-end' onClick={(): void => onDelete(i)} hoverColor='orangered'/>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer style={{width: '100%'}}>
                    <div className='d-flex flex-column' style={{width: '35%'}}>
                        <div className='d-flex justify-content-between'>
                            <Button variant='outline-danger' onClick={reset}>Cancel</Button>
                            <Button variant='outline-primary' onClick={async (): Promise<void> => {
                                await addRental();
                                setRentalList([]);
                            }}>Confirm</Button>
                        </div>
                        <div className='mt-2'>
                            {error && <p className='m-0' style={{color: 'red'}}>Error: {error}</p>}
                        </div>
                    </div>
                </Modal.Footer>
            </Modal>

            <Modal size='sm' show={helpModalOpen} onHide={(): void => setHelpModalOpen(false)} data-bs-theme='dark' className='text-light'>
                <Modal.Header closeButton>
                    <Modal.Title>
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

            <Modal centered show={clearModalOpen} onHide={(): void => setClearModalOpen(false)} data-bs-theme='dark' className='text-light'>
                <Modal.Header closeButton>
                    <Modal.Title>
                        Clear Logs
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className='mb-3' style={{color: '#c4c4c4'}}>
                        A copy of logs have been downloaded to your device in a format compatible with Excel, do you want to clear logs?
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <div className='d-flex flex-column'>
                        <div className='d-flex justify-content-between'>
                            <Button variant='outline-danger me-2' onClick={(): void => setClearModalOpen(false)}>No</Button>
                            <Button variant='outline-primary' onClick={clearLogs}>Yes</Button>
                        </div>
                        <div className='mt-2'>
                            {error && <p className='m-0' style={{color: 'red'}}>Error: {error}</p>}
                        </div>
                    </div>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default Dashboard;