import React, { useEffect, useState } from 'react';
import { checkCSSConsistency } from '../../services/crossBrowserChecker';

const ConsistencyChecker: React.FC = () => {
    const [consistencyResults, setConsistencyResults] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const handleCheckConsistency = async () => {
        setLoading(true);
        const results = await checkCSSConsistency();
        setConsistencyResults(results);
        setLoading(false);
    };

    useEffect(() => {
        handleCheckConsistency();
    }, []);

    return (
        <div className="consistency-checker">
            <h2>CSS Consistency Checker</h2>
            {loading ? (
                <p>Loading...</p>
            ) : (
                <ul>
                    {consistencyResults.map((result, index) => (
                        <li key={index}>
                            <strong>{result.browser}:</strong> {result.status}
                        </li>
                    ))}
                </ul>
            )}
            <button onClick={handleCheckConsistency}>Recheck Consistency</button>
        </div>
    );
};

export default ConsistencyChecker;