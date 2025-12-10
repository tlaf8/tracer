import React, { useState } from "react";
import QRCodeGrid from "./QRCodeGrid";
import { Buffer } from 'buffer';
import Icon from "./Icon.tsx";
import { Modal } from "react-bootstrap";

interface QRItem {
    data: string;
    encoding: boolean;
    label: string;
}

const MakeQRCode: React.FC = () => {
    const [rawString, setRawString] = useState<string>('');
    const [b64encode, setB64encode] = useState<boolean>(true);
    const [dataList, setDataList] = useState<Array<string>>([]);
    const [qrData, setQrData] = useState<QRItem[]>([]);
    const [pasteModalOpen, setPasteModalOpen] = useState(false);
    const [pasteText, setPasteText] = useState("");

    const [autoGenNumbers, setAutoGenNumbers] = useState(false);
    const [autoGenStart, setAutoGenStart] = useState<number>(0);
    const [autoGenEnd, setAutoGenEnd] = useState<number>(0);

    const [error, setError] = useState<string>('');
    const [pasteError, setPasteError] = useState('');

    const onDelete = (index: number): void => {
        setDataList(prev => prev.filter((_, i) => i !== index));
        setQrData(prev => prev.filter((_, i) => i !== index));
    };

    const generateEntries = (): void => {
        setError('');

        const base = rawString.trim();
        if (!base) return setError('No base provided.');
        if (autoGenStart < 0 || autoGenEnd < 0) return setError('Numbers cannot be negative.');
        if (autoGenEnd < autoGenStart) return setError('Start cannot be greater than end.');
        if (autoGenEnd === 0) return setError('End cannot be 0.');

        const existingLabels = new Set(dataList);
        const existingQR = new Set(qrData.map(q => q.label));

        const newItems: string[] = Array.from(
            { length: autoGenEnd - autoGenStart + 1 },
            (_, i) => `${base}-${autoGenStart + i}`
        );

        const uniqueItems = newItems.filter(
            item => !existingLabels.has(item) && !existingQR.has(item)
        );

        if (uniqueItems.length === 0) return;

        const newQRObjects: QRItem[] = uniqueItems.map(item => ({
            label: item,
            encoding: b64encode,
            data: b64encode ? Buffer.from(item).toString("base64") : item
        }));

        setDataList(prev => [...prev, ...uniqueItems]);
        setQrData(prev => [...prev, ...newQRObjects]);
    };

    const addManualEntry = (): void => {
        const trimmed = rawString.trim();
        if (!trimmed) return;

        const entry = b64encode ? Buffer.from(trimmed).toString('base64') : trimmed;

        setDataList(prev => [...prev, trimmed]);
        setQrData(prev => [...prev, {
            data: entry,
            encoding: b64encode,
            label: trimmed
        }]);

        setRawString('');
    };

    const handlePasteImport = (): void => {
        setPasteError("");

        if (!pasteText.trim()) {
            setPasteError("Nothing to import.");
            return;
        }

        const rows = pasteText
            .split(/\r?\n/)
            .map(r => r.trim())
            .filter(Boolean);

        if (rows.length === 0) {
            setPasteError("No valid lines found.");
            return;
        }

        const existing = new Set(dataList);
        const newLabels = rows.filter(r => !existing.has(r));

        if (newLabels.length === 0) {
            setPasteError("All entries already exist.");
            return;
        }

        const newQRObjects: QRItem[] = newLabels.map(label => ({
            label,
            encoding: b64encode,
            data: b64encode ? Buffer.from(label).toString("base64") : label
        }));

        setDataList(prev => [...prev, ...newLabels]);
        setQrData(prev => [...prev, ...newQRObjects]);

        setPasteModalOpen(false);
        setPasteText("");
    };

    return (
        <>
            <div data-bs-theme='dark' className='d-flex flex-row' style={{
                height: 'calc(100vh - 110px)'
            }}>
                <div style={{
                    width: '40vw',
                    height: '80vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'start',
                    marginTop: '5vh',
                    marginLeft: '3vw'
                }}>
                    <div className='w-75 text-light mb-1'>
                        Enter student or device name(s):
                    </div>

                    <div className='w-75 text-light d-flex flex-column align-items-end'>
                        <div className='input-group mb-2'>
                            <input
                                className='form-control bg-dark text-light border-secondary'
                                value={rawString}
                                onChange={(e) => setRawString(e.target.value.trimStart())}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') addManualEntry();
                                }}
                                style={{ width: '65%' }}
                            />

                            <select
                                className="form-select bg-dark text-light border-secondary w-auto"
                                value={b64encode ? "student" : "device"}
                                onChange={(e) => setB64encode(e.target.value === "student")}
                            >
                                <option value="student">Student</option>
                                <option value="device">Device</option>
                            </select>
                        </div>
                    </div>

                    <div className="w-75 d-flex flex-column text-light">
                        <div className='d-flex flex-row justify-content-between'>
                            <div className="form-check form-switch mb-2">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="autoGenNumbers"
                                    checked={autoGenNumbers}
                                    onChange={e => {
                                        setError('');
                                        setAutoGenNumbers(e.target.checked);
                                    }}
                                />
                                <label className="form-check-label" htmlFor="autoGenNumbers">
                                    Auto generate entries
                                </label>
                            </div>
                            {!autoGenNumbers && (
                                <Icon
                                    className="ms-3 bi bi-file-earmark-arrow-up fs-5"
                                    onClick={() => setPasteModalOpen(true)}
                                />
                            )}
                        </div>

                        {autoGenNumbers && (
                            <div className="d-flex flex-row align-items-center">
                                <input
                                    type="number"
                                    className="form-control bg-dark text-light border-secondary me-2"
                                    placeholder="Start"
                                    style={{ maxWidth: "175px" }}
                                    onChange={e => {
                                        const val = e.target.value;
                                        setAutoGenStart(val === "" ? 0 : Number(val));
                                    }}
                                />

                                <input
                                    type="number"
                                    className="form-control bg-dark text-light border-secondary me-2"
                                    placeholder="End"
                                    style={{ maxWidth: "175px" }}
                                    onChange={e => {
                                        const val = e.target.value;
                                        setAutoGenEnd(val === "" ? 0 : Number(val));
                                    }}
                                />

                                <button
                                    className="btn btn-outline-primary"
                                    onClick={generateEntries}
                                >
                                    Generate
                                </button>
                            </div>
                        )}
                    </div>

                    {error && (
                        <p className='m-0 mt-2 text-end' style={{ color: 'red' }}>
                            {error}
                        </p>
                    )}

                    <div className='d-flex flex-column mt-3 text-light overflow-auto scrollable-container'>
                        {dataList.length > 0 &&
                            <button className='btn btn-outline-danger mb-2' style={{ lineHeight: '10px' }}
                                    onClick={() => {
                                        setDataList([]);
                                        setQrData([]);
                                    }}>
                                Clear
                            </button>
                        }

                        {dataList.map((item, i) => (
                            <div
                                className='p-2 mt-1 d-flex flex-row justify-content-between'
                                key={i}
                                style={{
                                    border: '1px solid #4D5154',
                                    borderRadius: 'var(--bs-border-radius)',
                                    width: '30vw'
                                }}
                            >
                                <div style={{ maxWidth: '90%', textOverflow: 'ellipsis', overflow: 'hidden' }}>
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

                <div style={{ width: '60vw' }}>
                    <QRCodeGrid qrData={qrData} />
                </div>
            </div>

            <Modal show={pasteModalOpen} onHide={() => setPasteModalOpen(false)} data-bs-theme="dark" className="text-light">
                <Modal.Header closeButton>
                    <Modal.Title>Paste Entries</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <p className="text-muted">Paste Excel rows or plain text (one entry per line):</p>

                    <textarea
                        className="form-control bg-dark text-light border-secondary"
                        style={{ minHeight: "200px", resize: "vertical" }}
                        value={pasteText}
                        onChange={(e) => setPasteText(e.target.value)}
                    />

                    {pasteError && (
                        <p className="m-0 mt-2" style={{ color: "red" }}>
                            {pasteError}
                        </p>
                    )}
                </Modal.Body>

                <Modal.Footer>
                    <button className='btn btn-outline-danger' onClick={() => setPasteModalOpen(false)}>
                        Cancel
                    </button>

                    <button className='btn btn-outline-primary' onClick={handlePasteImport}>
                        Import
                    </button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default MakeQRCode;
