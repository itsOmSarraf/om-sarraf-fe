import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";

interface TimePickerInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function TimePickerInput({ value, onChange, placeholder }: TimePickerInputProps) {
    const [inputValue, setInputValue] = useState(value);

    useEffect(() => {
        setInputValue(value);
    }, [value]);

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);

        // Validate time format (HH:mm)
        if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(newValue)) {
            onChange(newValue);
        }
    };

    return (
        <Input
            type="time"
            value={inputValue}
            onChange={handleTimeChange}
            placeholder={placeholder}
            className="w-32"
        />
    );
} 