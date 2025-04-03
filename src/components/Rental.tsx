import React, {useState} from "react";

interface RentalProps {
    id: string,
    rental: string,
    status: string,
    onDelete: (name: string) => void,
}

const Rental: React.FC<RentalProps> = ({ id, rental, status, onDelete }) => {
    const [hovering, setHovering] = useState<boolean>(false);

    return (
        <tr key={id}>
            <td>
                {rental}
                <span className='ms-3 bi-x float-end' style={{
                    color: hovering ? 'orangered' : '#4D5154',
                    cursor: 'pointer'
                }}
                    onMouseEnter={() => setHovering(true)}
                    onMouseLeave={() => setHovering(false)}
                    onClick={() => onDelete(rental)}
                ></span>
            </td>
            <td>{status}</td>
        </tr>
    )
}

export default Rental;