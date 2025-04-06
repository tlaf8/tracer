import React, {useState} from "react";
import QRCodeGrid from "./QRCodeGrid";
import {Buffer} from 'buffer';
import Icon from "./Icon.tsx";

interface QRItem {
    data: string;
    label: string;
}

const MakeStudent: React.FC = () => {
    const [studentName, setStudentName] = useState<string>('');
    const [inputType, setInputType] = useState<string>('single');
    const [qrData, setQrData] = useState<QRItem[]>([]);

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
                            <Icon className='bi bi-chat-left-text me-3' onClick={() => {
                                setStudentName('');
                                setInputType(inputType === 'single' ? 'multi' : 'single')
                            }} fontSize='1.5rem' />
                            <Icon className='bi-arrow-clockwise float-end' onClick={() => generateQrData()} fontSize='1.5rem' />
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