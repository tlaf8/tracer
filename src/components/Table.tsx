interface TableProps {
    header: Array<string>;
    data: Array<Array<string>>;
}

const Table = ({ header, data }: TableProps) => {
    return (
        <div className='w-full text-lg'>
            <div className='sticky top-0 z-20 bg-neutral-800 border-b border-neutral-700'>
                <div className='w-full flex ps-2 pe-2'>
                    {header.map((h) => (
                        <div key={h} className='flex-1 p-2 text-left text-neutral-400 font-medium'>
                            {h}
                        </div>
                    ))}
                </div>
            </div>

            <div>
                {data.map((row, i) => (
                    <div
                        key={i}
                        className='flex border-b border-neutral-700 hover:bg-neutral-700/30 ps-2 pe-2'
                    >
                        {row.map((cell, j) => (
                            <div key={j} className='flex-1 p-2'>
                                {cell}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Table;