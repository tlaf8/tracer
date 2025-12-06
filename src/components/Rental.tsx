import React from "react";
import Icon from "./Icon.tsx";

interface RentalProps {
    rental: string,
    status: string,
    renter: string,
    onDelete: (name: string) => void,
}

const Rental: React.FC<RentalProps> = ({ rental, status, renter, onDelete }) => {
    return (
        <tr>
            <td>
                {rental}
                <Icon className='ms-3 bi-x float-end' onClick={(): void => onDelete(rental)} hoverColor='orangered'/>
            </td>
            <td>{status}</td>
            <td>{renter}</td>
        </tr>
    )
}

export default Rental;