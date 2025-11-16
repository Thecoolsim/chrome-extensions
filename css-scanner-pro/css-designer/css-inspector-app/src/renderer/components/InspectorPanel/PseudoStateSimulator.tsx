import React, { useState } from 'react';

const PseudoStateSimulator: React.FC = () => {
    const [pseudoClass, setPseudoClass] = useState<string>('');
    const [element, setElement] = useState<HTMLElement | null>(null);

    const handlePseudoClassChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setPseudoClass(event.target.value);
        if (element) {
            element.classList.toggle(event.target.value);
        }
    };

    const handleElementSelect = (event: React.MouseEvent<HTMLElement>) => {
        const target = event.currentTarget;
        setElement(target);
    };

    return (
        <div>
            <h2>Pseudo-Class Simulator</h2>
            <select onChange={handlePseudoClassChange}>
                <option value="">Select Pseudo-Class</option>
                <option value="hover">:hover</option>
                <option value="focus">:focus</option>
                <option value="active">:active</option>
                <option value="visited">:visited</option>
            </select>
            <div
                onMouseEnter={handleElementSelect}
                onFocus={handleElementSelect}
                style={{ border: '1px solid #ccc', padding: '20px', marginTop: '10px' }}
            >
                Hover or focus on this element to simulate the pseudo-class.
            </div>
        </div>
    );
};

export default PseudoStateSimulator;