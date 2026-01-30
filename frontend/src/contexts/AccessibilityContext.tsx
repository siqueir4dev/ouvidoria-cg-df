import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface AccessibilityContextProps {
    fontSize: number;
    highContrast: boolean;
    readingMode: boolean;
    increaseFont: () => void;
    decreaseFont: () => void;
    toggleHighContrast: () => void;
    toggleReadingMode: () => void;
    resetSettings: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextProps | undefined>(undefined);

export const useAccessibility = () => {
    const context = useContext(AccessibilityContext);
    if (!context) {
        throw new Error('useAccessibility must be used within an AccessibilityProvider');
    }
    return context;
};

export const AccessibilityProvider = ({ children }: { children: ReactNode }) => {
    const [fontSize, setFontSize] = useState<number>(() => {
        const saved = localStorage.getItem('fontSize');
        return saved ? parseInt(saved, 10) : 100; // Percentage
    });
    const [highContrast, setHighContrast] = useState<boolean>(() => {
        return localStorage.getItem('highContrast') === 'true';
    });
    const [readingMode, setReadingMode] = useState<boolean>(() => {
        return localStorage.getItem('readingMode') === 'true';
    });

    useEffect(() => {
        document.documentElement.style.fontSize = `${fontSize}%`;
        localStorage.setItem('fontSize', fontSize.toString());
    }, [fontSize]);

    useEffect(() => {
        if (highContrast) {
            document.documentElement.classList.add('high-contrast');
        } else {
            document.documentElement.classList.remove('high-contrast');
        }
        localStorage.setItem('highContrast', highContrast.toString());
    }, [highContrast]);

    useEffect(() => {
        if (readingMode) {
            document.body.classList.add('reading-mode');
        } else {
            document.body.classList.remove('reading-mode');
        }
        localStorage.setItem('readingMode', readingMode.toString());
    }, [readingMode]);

    const increaseFont = () => setFontSize(prev => Math.min(prev + 10, 150));
    const decreaseFont = () => setFontSize(prev => Math.max(prev - 10, 80));
    const toggleHighContrast = () => setHighContrast(prev => !prev);
    const toggleReadingMode = () => setReadingMode(prev => !prev);

    const resetSettings = () => {
        setFontSize(100);
        setHighContrast(false);
        setReadingMode(false);
    };

    return (
        <AccessibilityContext.Provider
            value={{
                fontSize,
                highContrast,
                readingMode,
                increaseFont,
                decreaseFont,
                toggleHighContrast,
                toggleReadingMode,
                resetSettings
            }}
        >
            {children}
        </AccessibilityContext.Provider>
    );
};
