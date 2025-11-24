import React, { useState } from 'react';

const TailwindConverter: React.FC = () => {
    const [cssInput, setCssInput] = useState<string>('');
    const [tailwindOutput, setTailwindOutput] = useState<string>('');

    const convertToTailwind = (css: string) => {
        // Placeholder for the conversion logic
        // This function should convert standard CSS to Tailwind CSS classes
        // For now, it just returns the input as a demonstration
        return css; 
    };

    const handleConvert = () => {
        const converted = convertToTailwind(cssInput);
        setTailwindOutput(converted);
    };

    return (
        <div className="tailwind-converter">
            <h2>Tailwind CSS Converter</h2>
            <textarea
                value={cssInput}
                onChange={(e) => setCssInput(e.target.value)}
                placeholder="Enter your CSS here"
                rows={10}
                className="css-input"
            />
            <button onClick={handleConvert} className="convert-button">
                Convert to Tailwind
            </button>
            <h3>Converted Tailwind CSS:</h3>
            <textarea
                value={tailwindOutput}
                readOnly
                rows={10}
                className="tailwind-output"
            />
        </div>
    );
};

export default TailwindConverter;