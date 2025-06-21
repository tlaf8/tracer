import React, {useEffect, useState} from "react";
import QRCodeGrid from "./QRCodeGrid";
import {Buffer} from 'buffer';
import Icon from "./Icon.tsx";

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

    const onDelete = (index: number) => {
        const newList = [...dataList];
        const newQrData = [...qrData];
        newList.splice(index, 1);
        newQrData.splice(index, 1);
        setDataList(newList);
        setQrData(newQrData);
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
                    <div className='w-75 text-light mb-1'>
                        Enter student or device name(s):
                    </div>
                    <div className='w-75 text-light d-flex flex-column align-items-end'>
                        <div className='input-group mb-3'>
                            <input
                                className='form-control bg-dark text-light border-secondary'
                                value={rawString}
                                onChange={(e) => {
                                    setRawString(e.target.value);
                                }}
                                onKeyDown={(k) => {
                                    const trimmed = rawString.trim();
                                    if (k.key === 'Enter' && trimmed !== '') {
                                        setDataList([...dataList, trimmed]);
                                        setQrData([...qrData, {
                                            data: b64encode ? Buffer.from(trimmed).toString('base64') : trimmed,
                                            encoding: b64encode,
                                            label: trimmed
                                        }])
                                        setRawString('');
                                    }
                                }}
                            ></input>
                            <button className='btn btn-outline-secondary dropdown-toggle' type='button'
                                    data-bs-toggle='dropdown' aria-expanded='false'>{b64encode ? 'Student' : 'Device'}
                            </button>
                            <ul className='dropdown-menu dropdown-menu-end bg-dark'>
                                <li>
                                    <button className='dropdown-item bg-dark text-light' onClick={() => {
                                        setB64encode(!b64encode);
                                    }}>{b64encode ? 'Device' : 'Student'}</button>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className='w-75 mt-1 text-light'>
                        {dataList.map((item, i) => (
                            <div className='p-2 mt-1' key={i} style={{
                                border: '1px solid #4D5154',
                                borderRadius: 'var(--bs-border-radius)'
                            }}>
                                {item}
                                <Icon className='bi bi-x float-end' onClick={() => onDelete(i)} hoverColor='orangered'/>
                            </div>
                        ))}
                    </div>
                </div>
                <div style={{
                    width: '60vw',
                    borderLeft: '3px solid #212529',
                }}>
                    <QRCodeGrid qrData={qrData}/>
                </div>
            </div>
        </>
    )
};

export default MakeQRCode;