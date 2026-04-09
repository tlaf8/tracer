import Table from './Table'

const sampleHeader = [
    'Timestamp', 'Rental', 'Student', 'Status'
];

const sampleData = [
    [(new Date()).toLocaleTimeString(), 'SF219-1', 'Yunli', 'OUT'],
    [(new Date()).toLocaleTimeString(), 'SF219-1', 'Cipher', 'OUT'],
    [(new Date()).toLocaleTimeString(), 'SF219-1', 'Castorice', 'OUT'],
    [(new Date()).toLocaleTimeString(), 'SF219-1', 'Nihilux', 'OUT'],
    [(new Date()).toLocaleTimeString(), 'SF219-1', 'Xueyi', 'OUT'],
    [(new Date()).toLocaleTimeString(), 'SF219-1', 'Firefly', 'OUT'],
    [(new Date()).toLocaleTimeString(), 'SF219-1', 'Sparkle', 'OUT'],
    [(new Date()).toLocaleTimeString(), 'SF219-1', 'Huo Huo', 'OUT'],
    [(new Date()).toLocaleTimeString(), 'SF219-1', 'Evernight', 'OUT'],
    [(new Date()).toLocaleTimeString(), 'SF219-1', 'Fugue', 'OUT'],
    [(new Date()).toLocaleTimeString(), 'SF219-1', 'Hysilens', 'OUT'],
    [(new Date()).toLocaleTimeString(), 'SF219-1', 'Sparxie', 'OUT'],
]

const Dashboard = () => {
    return (
        <div className='flex-1 flex items-center justify-center bg-neutral-800'>
            <div className='flex flex-col w-4/5 h-[85%] bg-neutral-900 rounded-2xl p-3 gap-3'>
                <div className='flex-1 bg-neutral-800 rounded-lg overflow-auto hide-scrollbar'>
                    <Table header={sampleHeader} data={sampleData} />
                </div>
                <div className='flex-1 bg-neutral-800 rounded-lg'>
                </div>
            </div>
        </div>
    )
}

export default Dashboard;