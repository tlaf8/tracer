import React, {useState} from 'react';

interface IconProps {
    className: string,
    onClick: () => void,
    fontSize?: string,
    hoverColor?: string,
}

const Icon: React.FC<IconProps> = ({ className, onClick, fontSize, hoverColor }: IconProps) => {
    const [hovering, setHovering] = useState<boolean>(false);

    return (
        <span className={className} style={{
            color: hovering ? (hoverColor ? hoverColor : 'white') : '#4D5154',
            cursor: 'pointer',
            fontSize: (fontSize ? fontSize : ''),
        }}
              onClick={onClick}
              onMouseEnter={(): void => setHovering(true)}
              onMouseLeave={(): void => setHovering(false)}>
        </span>
    )
}

export default Icon;