import React, {useState} from 'react';

interface IconProps {
    className: string,
    onClick: () => void,
    fontSize?: string,
    hoverColor?: string,
}

const Icon: React.FC<IconProps> = ({ className, onClick, fontSize, hoverColor }) => {
    const [hovering, setHovering] = useState(false);

    return (
        <span className={className} style={{
            color: hovering ? (hoverColor ? hoverColor : 'white') : '#4D5154',
            cursor: 'pointer',
            fontSize: (fontSize ? fontSize : ''),
        }}
              onClick={onClick}
              onMouseEnter={() => setHovering(true)}
              onMouseLeave={() => setHovering(false)}>
        </span>
    )
}

export default Icon;