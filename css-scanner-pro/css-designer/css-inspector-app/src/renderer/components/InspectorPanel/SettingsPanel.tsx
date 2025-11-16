import React, { useState } from 'react';

const SettingsPanel: React.FC = () => {
    const [settings, setSettings] = useState({
        enablePseudoStateSimulation: true,
        optimizeCSS: true,
        useTailwind: false,
        multiBrowserSupport: true,
    });

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = event.target;
        setSettings(prevSettings => ({
            ...prevSettings,
            [name]: checked,
        }));
    };

    const handleSave = () => {
        // Logic to save settings (e.g., to local storage or a backend)
        console.log('Settings saved:', settings);
    };

    return (
        <div className="settings-panel">
            <h2>Settings</h2>
            <div>
                <label>
                    <input
                        type="checkbox"
                        name="enablePseudoStateSimulation"
                        checked={settings.enablePseudoStateSimulation}
                        onChange={handleChange}
                    />
                    Enable Pseudo-State Simulation
                </label>
            </div>
            <div>
                <label>
                    <input
                        type="checkbox"
                        name="optimizeCSS"
                        checked={settings.optimizeCSS}
                        onChange={handleChange}
                    />
                    Optimize CSS
                </label>
            </div>
            <div>
                <label>
                    <input
                        type="checkbox"
                        name="useTailwind"
                        checked={settings.useTailwind}
                        onChange={handleChange}
                    />
                    Use Tailwind CSS
                </label>
            </div>
            <div>
                <label>
                    <input
                        type="checkbox"
                        name="multiBrowserSupport"
                        checked={settings.multiBrowserSupport}
                        onChange={handleChange}
                    />
                    Multi-Browser Support
                </label>
            </div>
            <button onClick={handleSave}>Save Settings</button>
        </div>
    );
};

export default SettingsPanel;