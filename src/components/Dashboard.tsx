import React, { useCallback, useEffect, useState } from 'react';
import axios, { isAxiosError } from 'axios';
import { Button, Col, Container, Modal, Row, Table } from 'react-bootstrap';
import Rental from './Rental';
import { Link } from 'react-router-dom';
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
};

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
};

const Dashboard: React.FC = () => {
    const [logs, setLogs] = useState<Array<Record<string, string>>>([]);
    const [status, setStatus] = useState<Array<Record<string, string>>>([]);
    const [hoveringStudent, setHoveringStudent] = useState<boolean>(false);
    const [rentalModalOpen, setRentalModalOpen] = useState<boolean>(false);
    const [helpModalOpen, setHelpModalOpen] = useState<boolean>(false);
    const [clearModalOpen, setClearModalOpen] = useState<boolean>(false);
    const [fetchingRentals, setFetchingRentals] = useState<boolean>(false);
    const [fetchingLogs, setFetchingLogs] = useState<boolean>(false);

    const [globalError, setGlobalError] = useState<string>('');
    const [rentalModalError, setRentalModalError] = useState<string>('');
    const [clearLogsError, setClearLogsError] = useState<string>('');

    const [rawString, setRawString] = useState<string>('');
    const [autoGenNumbers, setAutoGenNumbers] = useState(false);
    const [autoGenStart, setAutoGenStart] = useState<number>(0);
    const [autoGenEnd, setAutoGenEnd] = useState<number>(0);
    const [rentalList, setRentalList] = useState<Array<string>>([]);

    const reset = (): void => {
        setRentalModalError('');
        setFetchingRentals(false);
        setFetchingLogs(false);
        setRentalModalOpen(false);
    };

    const addRental = async (): Promise<void> => {
        const token = localStorage.getItem('token');
        setRentalModalError('');

        if (!token) return setRentalModalError('No authentication token found. Please link this device.');
        if (rentalList.length === 0) return setRentalModalError('No rentals entered.');

        try {
            await axios.post(
                `/api/rentals/add`,
                { rentals: rentalList },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            reset();
            await fetchDataCallback();
        } catch (err) {
            if (isAxiosError(err)) {
                if (err.response?.status === 400) {
                    setRentalModalError(err.response?.data.error || 'Invalid rentals.');
                } else {
                    setRentalModalError(err.message || 'Error adding rentals.');
                }
            } else {
                setRentalModalError('Something went wrong, check console for details.');
                console.error(err);
            }
        }
    };

    const removeRental = async (rental: string): Promise<void> => {
        const token = localStorage.getItem('token');
        if (!token) return setGlobalError('No authentication token found. Please link this device.');

        try {
            await axios.post(
                `/api/rentals/remove`,
                { rental },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            await fetchDataCallback();
        } catch (err) {
            if (isAxiosError(err)) {
                if (err.response?.status === 404) {
                    setGlobalError(err.response?.data.error || 'Rental not found.');
                } else {
                    setGlobalError(err.message || 'Error removing rental.');
                }
            } else {
                setGlobalError('Something went wrong, check console for details.');
                console.error(err);
            }
        }
    };

    const generateRentals = (): void => {
        if (autoGenStart < 0 || autoGenEnd < 0) return setRentalModalError('Numbers cannot be negative.');
        if (autoGenEnd === 0) return setRentalModalError('End cannot be 0.');
        if (autoGenStart > autoGenEnd) return setRentalModalError('Start cannot be greater than end.');
        if (rawString.trim() === '') return setRentalModalError('No base provided.');
        if (autoGenStart > autoGenEnd) return setRentalModalError('Start cannot be greater than end.');

        setRentalModalError('');
        setRentalList(prev => {
            const newItems = Array.from(
                { length: autoGenEnd - autoGenStart + 1 },
                (_, i) => `${rawString}-${autoGenStart + i}`
            );

            const prevSet = new Set(prev);
            const globalSet = new Set(status.map(s => s.rental));

            const uniqueNewItems = newItems.filter(item =>
                !prevSet.has(item) && !globalSet.has(item)
            );

            return [...prev, ...uniqueNewItems];
        });
    };

    const exportCsv = async (): Promise<void> => {
        setGlobalError('');

        if (logs.length === 0) return setGlobalError('No logs to export.');

        const token = localStorage.getItem('token');
        if (!token) return setGlobalError('No authentication token found. Please link this device.');

        try {
            const response = await axios.get(`/api/export`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                responseType: 'blob',
            });

            const contentDisposition = response.headers['content-disposition'];
            let filename = 'logs.csv';

            if (contentDisposition) {
                const match = contentDisposition.match(/filename="?(.+)"?/);
                if (match && match[1]) filename = match[1];
            }

            const blob = new Blob([response.data], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');

            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            URL.revokeObjectURL(url);

            setClearModalOpen(true);
            setClearLogsError('');
        } catch (err) {
            setGlobalError('Cannot export data to CSV. Please try again.');
            console.error('Export error:', err);
        }
    };

    const clearLogs = async (): Promise<void> => {
        const token = localStorage.getItem('token');
        setClearLogsError('');

        if (!token) return setClearLogsError('No authentication token found. Please link this device.');

        try {
            await axios.get(`/api/clear`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            setClearModalOpen(false);
        } catch (err) {
            if (isAxiosError(err)) {
                if (err.response?.status === 400) {
                    setClearLogsError(err.response?.data.error || 'Unable to clear logs.');
                } else {
                    setClearLogsError(err.message || 'Error clearing logs.');
                }
            } else {
                setClearLogsError('Something went wrong, check console for details.');
                console.error(err);
            }
        }
    };

    const onDelete = (index: number): void => {
        const newList = [...rentalList];
        newList.splice(index, 1);
        setRentalList(newList);
    };

    const fetchDataCallback = useCallback(async (): Promise<void> => {
        setFetchingRentals(true);
        setFetchingLogs(true);
        setGlobalError('');

        const token = localStorage.getItem('token');
        if (!token) {
            setGlobalError('No authentication token found. Please link this device.');
            setFetchingRentals(false);
            setFetchingLogs(false);
            return;
        }

        try {
            const logsResponse = await axios.get(`/api/logs`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setLogs(logsResponse.data.logs);
            setFetchingLogs(false);

            const statusResponse = await axios.get(`/api/status`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const sortedStatus = [...statusResponse.data.status].sort((a: Status, b: Status) =>
                naturalCompare(a.rental, b.rental)
            );

            setStatus(sortedStatus);
            setFetchingRentals(false);
        } catch (err) {
            setFetchingRentals(false);
            setFetchingLogs(false);

            if (isAxiosError(err)) {
                if (err.response?.status === 401) {
                    localStorage.removeItem('token');
                    setGlobalError('Invalid token, please link this device again.');
                } else {
                    setGlobalError(err.message || 'Error fetching data.');
                }
            } else {
                setGlobalError('Something went wrong, check console for details.');
                console.error(err);
            }
        }
    }, []);

    useEffect((): void => {
        fetchDataCallback().catch(err => {
            setGlobalError('Failed fetching data. Check console for details.');
            console.error(err);
        });
    }, [fetchDataCallback]);

    return (
        <>
            <Container className='mt-5 p-4 bg-dark rounded'>
                {globalError && <p className='text-danger'>{globalError}</p>}
                <Row className='mb-3'>
                    <Col>
                        <h4 className='text-white'>
                            Logs
                            <Icon className='bi-arrow-clockwise float-end' onClick={fetchDataCallback} />
                            <Icon
                                className='bi bi-file-earmark-arrow-down me-2 float-end'
                                onClick={(): Promise<void> => exportCsv()}
                            />
                            {fetchingLogs && (
                                <div
                                    className='spinner-border spinner-border-sm float-end me-2 mt-1'
                                    role='status'
                                ></div>
                            )}
                        </h4>
                        <div
                            className='overflow-y-auto'
                            style={{
                                maxHeight: '30vh',
                                scrollbarWidth: 'none',
                                border: '1px solid #4D5154',
                            }}
                        >
                            <Table striped bordered hover responsive variant='dark'>
                                <thead className='bg-dark'>
                                <tr>
                                    <th>ID</th>
                                    <th>Rental</th>
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
                        <h4 className='text-white'>
                            Rentals
                            <Icon className='bi-plus float-end' onClick={(): void => setRentalModalOpen(true)} />
                            {fetchingRentals && (
                                <div
                                    className='spinner-border spinner-border-sm float-end me-2 mt-1'
                                    role='status'
                                ></div>
                            )}
                        </h4>
                        <div
                            className='overflow-y-auto'
                            style={{
                                maxHeight: '30vh',
                                scrollbarWidth: 'none',
                                border: '1px solid #4D5154',
                            }}
                        >
                            <Table striped bordered hover responsive variant='dark'>
                                <thead className='bg-dark'>
                                <tr>
                                    <th>Rental</th>
                                    <th>Status</th>
                                    <th>Renter</th>
                                </tr>
                                </thead>
                                <tbody>
                                {status.map((stat, key) => (
                                    <Rental
                                        key={key}
                                        rental={stat.rental}
                                        status={stat.status}
                                        renter={stat.renter}
                                        onDelete={removeRental}
                                    />
                                ))}
                                </tbody>
                            </Table>
                        </div>
                        <div
                            className='float-end mt-2'
                            onMouseEnter={(): void => setHoveringStudent(true)}
                            onMouseLeave={(): void => setHoveringStudent(false)}
                        >
                            <Link
                                to='/make'
                                style={{
                                    textDecoration: 'none',
                                    color: hoveringStudent ? 'white' : '#4D5154',
                                    fontSize: '0.9rem',
                                }}
                            >
                                Create QR Codes
                            </Link>
                        </div>
                    </Col>
                </Row>
            </Container>

            {/* New rental modal */}
            <Modal show={rentalModalOpen} data-bs-theme='dark' className='text-light'>
                <Modal.Header>
                    <Modal.Title
                        style={{
                            width: '100%',
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        New rental
                        <Icon className='ms-3 bi bi-info-circle' onClick={(): void => setHelpModalOpen(true)} />
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div>
                        <div>Enter new name of device:</div>
                        <div className='mt-3'>
                            <input
                                className='form-control bg-dark text-light border-secondary'
                                value={rawString}
                                onChange={e => setRawString(e.target.value)}
                                onKeyDown={k => {
                                    const trimmed = rawString.trim();
                                    if (k.key === 'Enter' && trimmed !== '') {
                                        setRentalList([...rentalList, trimmed]);
                                        setRawString('');
                                    }
                                }}
                            />

                            <div className='form-check form-switch mt-2 mb-2'>
                                <input
                                    className='form-check-input'
                                    type='checkbox'
                                    role='switch'
                                    id='autoGenNumbers'
                                    checked={autoGenNumbers}
                                    onChange={e => setAutoGenNumbers(e.target.checked)}
                                />
                                <label className='form-check-label' htmlFor='autoGenNumbers'>
                                    Auto generate rentals
                                </label>
                            </div>

                            {autoGenNumbers && (
                                <div className='d-flex flex-row justify-content-between align-items-center'>
                                    <input
                                        type='number'
                                        className='form-control bg-dark text-light border-secondary'
                                        placeholder='Start'
                                        style={{ maxWidth: '175px' }}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setAutoGenStart(val === '' ? 0 : Number(val));
                                        }}
                                    />
                                    <input
                                        type='number'
                                        className='form-control bg-dark text-light border-secondary'
                                        placeholder='End'
                                        style={{ maxWidth: '175px' }}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setAutoGenEnd(val === '' ? 0 : Number(val));
                                        }}
                                    />
                                    <button className='btn btn-outline-primary ms-2' onClick={generateRentals}>
                                        Generate
                                    </button>
                                </div>
                            )}

                            {rentalList.length > 0 &&
                                <button className='btn btn-outline-danger mt-2' onClick={() => { setRentalList([]) }} style={{
                                    lineHeight: '10px',
                                    width: '100%'
                                }}>Clear</button>
                            }

                            <div className='mt-3 overflow-y-auto scrollable-container' style={{ maxHeight: '50vh' }}>
                                {rentalList.map((item, i) => (
                                    <div
                                        className='p-2 mt-1 d-flex flex-row justify-content-between'
                                        key={i}
                                        style={{
                                            border: '1px solid #4D5154',
                                            borderRadius: 'var(--bs-border-radius)',
                                        }}
                                    >
                                        <div
                                            style={{
                                                maxWidth: '90%',
                                                textOverflow: 'ellipsis',
                                                overflow: 'hidden',
                                            }}
                                        >
                                            {item}
                                        </div>
                                        <Icon
                                            className='bi bi-x float-end'
                                            onClick={() => onDelete(i)}
                                            hoverColor='orangered'
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <div className='w-100 d-flex flex-column'>
                        <div className='d-flex justify-content-end'>
                            <button className='btn btn-outline-danger me-2' onClick={reset}>
                                Cancel
                            </button>

                            <button
                                className='btn btn-outline-primary'
                                onClick={async (): Promise<void> => {
                                    await addRental();
                                    setRentalList([]);
                                }}
                            >
                                Confirm
                            </button>
                        </div>
                        {rentalModalError && (
                            <p className='m-0 mt-2 text-end' style={{ color: 'red' }}>
                                {rentalModalError}
                            </p>
                        )}
                    </div>
                </Modal.Footer>
            </Modal>

            {/* Help modal */}
            <Modal
                size='sm'
                show={helpModalOpen}
                onHide={(): void => setHelpModalOpen(false)}
                data-bs-theme='dark'
                className='text-light'
            >
                <Modal.Header closeButton>
                    <Modal.Title>Help</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className='mb-3' style={{ color: '#c4c4c4' }}>
                        <strong className='text-white'>Single Rental</strong>
                        <p>Enter the name of the rental and press 'Enter'</p>
                    </div>
                    <div style={{ color: '#c4c4c4' }}>
                        <strong className='text-white'>Multiple Rentals</strong>
                        <p>Select 'Auto generate rentals' and enter the start and end numbers of rentals to be generated.</p>
                    </div>
                    <div>
                        Once all names are entered, press 'Confirm' to add.
                    </div>
                </Modal.Body>
            </Modal>

            {/* Clear logs modal */}
            <Modal
                centered
                show={clearModalOpen}
                onHide={(): void => setClearModalOpen(false)}
                data-bs-theme='dark'
                className='text-light'
            >
                <Modal.Header closeButton>
                    <Modal.Title>Clear Logs</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className='mb-3' style={{ color: '#c4c4c4' }}>
                        A copy of logs have been downloaded to your device in a format compatible with Excel, do you
                        want to clear logs?
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <div className='d-flex flex-column w-100'>
                        <div className='d-flex justify-content-between'>
                            <Button
                                variant='outline-danger me-2'
                                onClick={(): void => setClearModalOpen(false)}
                            >
                                No
                            </Button>
                            <Button variant='outline-primary' onClick={clearLogs}>
                                Yes
                            </Button>
                        </div>
                        {clearLogsError && (
                            <p className='m-0 mt-2 text-end' style={{ color: 'red' }}>
                                {clearLogsError}
                            </p>
                        )}
                    </div>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default Dashboard;
