import React from 'react';

const VLibras: React.FC = () => {
    // The script is loaded in index.html to ensure proper initialization
    // We just render the required container structure here
    return (
        // @ts-ignore
        <div vw="true" className="enabled">
            <div vw-access-button="true" className="active"></div>
            <div vw-plugin-wrapper="true">
                <div className="vw-plugin-top-wrapper"></div>
            </div>
        </div>
    );
};

export default VLibras;
