import React, {useEffect, useState} from "react";
import QRCodeGrid from "./QRCodeGrid";
import {Buffer} from 'buffer';
import Icon from "./Icon.tsx";

interface QRItem {
    data: string;
    label: string;
}

const MakeStudent: React.FC = () => {
    const [rawString, setRawString] = useState<string>('');
    const [dataList, setDataList] = useState<Array<string>>([]);
    const [qrData, setQrData] = useState<QRItem[]>([]);

    const onDelete = (index: number) => {
        const newList = [...dataList];
        newList.splice(index, 1);
        setDataList(newList);
    }

    useEffect(() => {
        const newQrData: QRItem[] = [];
        dataList.map((item: string) => {
            newQrData.push({
                data: Buffer.from(item).toString('base64'),
                label: item
            });
        })
        setQrData(newQrData);
    }, [dataList]);

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
                                    setRawString('');
                                }
                            }}
                        ></input>
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
                    <QRCodeGrid qrData={qrData} />
                </div>
            </div>
        </>
    )
};

export default MakeStudent;