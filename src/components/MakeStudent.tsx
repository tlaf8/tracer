import React, {useState} from "react";
import QRCodeGrid from "./QRCodeGrid";
import {Buffer} from 'buffer';

interface QRItem {
    data: string;
    label: string;
}

const MakeStudent: React.FC = () => {
    const [studentName, setStudentName] = useState<string>('');
    const [inputType, setInputType] = useState<string>('single');
    const [hoveringBulk, setHoveringBulk] = useState<boolean>(false);
    const [qrData, setQrData] = useState<QRItem[]>([]);
    const [hoveringRefresh, setHoveringRefresh] = useState<boolean>(false);

    const generateQrData = () => {
        const qrList: QRItem[] = [];

        studentName.split('\n').map((name) => {
            const stripped = name.replace(/\s/g, '');
            if (stripped !== '') {
                qrList.push({
                    data: Buffer.from(stripped).toString('base64'),
                    label: name,
                })
            }
        })

        setQrData(qrList);
    }

    return (
        <>
            <div className='d-flex flex-row' style={{
                height: 'calc(100vh - 56px)'
            }}>
                <div style={{
                    width: '40vw',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    marginTop: '10vh'
                }}>
                    <div className='w-75 text-light'>
                        Enter student name(s):
                    </div>
                    <div className='w-75 text-light d-flex flex-column align-items-end'>
                        {inputType === 'single' ? (
                            <input
                                type='text'
                                className='form-control bg-dark text-light border-secondary'
                                placeholder='Enter name of student'
                                value={studentName}
                                onChange={(e) => {
                                    setStudentName(e.target.value)
                                }}
                            />
                        ) : (
                            <textarea
                                className='form-control bg-dark text-light border-secondary'
                                placeholder='Enter names of students'
                                value={studentName}
                                onChange={(e) => {
                                    setStudentName(e.target.value);
                                }}
                            ></textarea>
                        )}
                        <div className='float-end'>
                            <span className='bi bi-chat-left-text me-3' style={{
                                color: hoveringBulk ? 'white' : '#4D5154',
                                cursor: 'pointer',
                                fontSize: '1.5rem'
                            }}
                                  onClick={() => {
                                      setStudentName('');
                                      setInputType(inputType === 'single' ? 'multi' : 'single')
                                  }}
                                  onMouseEnter={() => setHoveringBulk(true)}
                                  onMouseLeave={() => setHoveringBulk(false)}>
                            </span>
                            <span className='bi-arrow-clockwise float-end' style={{
                                color: hoveringRefresh ? 'white' : '#4D5154',
                                cursor: 'pointer',
                                fontSize: '1.5rem'
                            }}
                                  onClick={() => generateQrData()}
                                  onMouseEnter={() => setHoveringRefresh(true)}
                                  onMouseLeave={() => setHoveringRefresh(false)}>
                            </span>
                        </div>
                    </div>
                </div>
                <div style={{
                    width: '60vw',
                    borderLeft: '3px solid #212529',
                }}>
                    <QRCodeGrid qrData={qrData} />
                </div>
            </div>
        </>
    )
};

export default MakeStudent;