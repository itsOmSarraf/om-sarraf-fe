import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";

interface CopyDayDialogProps {
    isOpen: boolean;
    onClose: () => void;
    sourceDate: Date | null;
    onCopy: (targetDate: Date) => void;
}

export function CopyDayDialog({ isOpen, onClose, sourceDate, onCopy }: CopyDayDialogProps) {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

    const handleCopy = () => {
        if (selectedDate) {
            onCopy(selectedDate);
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Copy Availability To Another Day</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => sourceDate ? date.toDateString() === sourceDate.toDateString() : false}
                    />
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                        <Button onClick={handleCopy} disabled={!selectedDate}>Copy</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
} 