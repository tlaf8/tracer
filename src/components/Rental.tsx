import React from "react";
import Icon from "./Icon.tsx";

interface RentalProps {
    id: string,
    rental: string,
    status: string,
    renter: string,
    onDelete: (name: string) => void,
}

const Rental: React.FC<RentalProps> = ({ id, rental, status, renter, onDelete }: RentalProps) => {
    return (
        <tr key={id}>
            <td>
                {rental}
                <Icon className='ms-3 bi-x float-end' onClick={(): void => onDelete(rental)} hoverColor='orangered' />
            </td>
            <td>{status}</td>
            <td>{renter}</td>
        </tr>
    )
}

export default Rental;