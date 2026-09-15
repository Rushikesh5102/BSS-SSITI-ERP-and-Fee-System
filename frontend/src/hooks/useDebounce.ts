import { useState, useEffect } from 'react';

/**
 * Universal Debounce Hook
 * Delays updating the debounced value until after delay milliseconds have passed
 * since the last time the value was changed.
 * 
 * @param value The value to debounce (e.g. search input)
 * @param delay The delay in milliseconds (default: 300ms)
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}
