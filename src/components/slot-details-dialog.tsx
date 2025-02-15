import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
import { Slot } from "@/lib/db";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { TimePickerInput } from "@/components/time-picker-input";
import { useState, useEffect } from "react";

type RepeatOption = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

interface SlotDetailsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    slot: Slot | null;
    isOwnSlot: boolean;
    onDelete?: () => void;
    onBook?: () => void;
    onEdit: (repeatOption: RepeatOption, repeatUntil: Date | null, newDate?: string, newStartTime?: string, newEndTime?: string) => void;
    editMode: boolean;
    setEditMode: (value: boolean) => void;
    repeatOption: RepeatOption;
    setRepeatOption: (value: RepeatOption) => void;
    repeatUntil: Date | null;
    setRepeatUntil: (value: Date | null) => void;
}

export function SlotDetailsDialog({
    isOpen,
    onClose,
    slot,
    isOwnSlot,
    onDelete,
    onBook,
    onEdit,
    editMode,
    setEditMode,
    repeatOption,
    setRepeatOption,
    repeatUntil,
    setRepeatUntil
}: SlotDetailsDialogProps) {
    if (!slot) return null;

    const formattedDate = format(new Date(slot.date), 'MMMM do, yyyy');

    // Add state for time/date editing
    const [editDate, setEditDate] = useState(slot.date);
    const [editStartTime, setEditStartTime] = useState(slot.startTime);
    const [editEndTime, setEditEndTime] = useState(slot.endTime);

    // Reset edit values when dialog opens/closes
    useEffect(() => {
        if (isOpen && slot) {
            setEditDate(slot.date);
            setEditStartTime(slot.startTime);
            setEditEndTime(slot.endTime);
        }
    }, [isOpen, slot]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {isOwnSlot ? "Your Availability Slot" : `Available Slot with ${slot.userName}`}
                    </DialogTitle>
                    <DialogDescription>
                        View details about this time slot
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {editMode ? (
                        <>
                            <div className="flex flex-col space-y-2">
                                <label>Date:</label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className={cn("justify-start text-left font-normal")}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {format(new Date(editDate), "PPP")}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={new Date(editDate)}
                                            onSelect={(date) => date && setEditDate(date.toISOString().split('T')[0])}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="flex flex-col space-y-2">
                                <label>Time:</label>
                                <div className="flex items-center gap-2">
                                    <TimePickerInput
                                        value={editStartTime}
                                        onChange={setEditStartTime}
                                        placeholder="Start Time"
                                    />
                                    <span>to</span>
                                    <TimePickerInput
                                        value={editEndTime}
                                        onChange={setEditEndTime}
                                        placeholder="End Time"
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4" />
                                <span>{formattedDate}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>
                                    {slot.startTime} - {slot.endTime}
                                </span>
                            </div>
                        </>
                    )}
                    {slot.timezone && (
                        <div className="text-sm text-muted-foreground">
                            Timezone: {slot.timezone}
                        </div>
                    )}
                </div>
                <div className="space-y-4">
                    {isOwnSlot && (
                        <div className="space-y-4">
                            {editMode ? (
                                <>
                                    <Select value={repeatOption} onValueChange={(value: RepeatOption) => setRepeatOption(value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Repeat options" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">No repeat</SelectItem>
                                            <SelectItem value="daily">Daily</SelectItem>
                                            <SelectItem value="weekly">Weekly</SelectItem>
                                            <SelectItem value="monthly">Monthly</SelectItem>
                                            <SelectItem value="yearly">Yearly</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    {repeatOption !== 'none' && (
                                        <div className="flex flex-col space-y-2">
                                            <label>Repeat until:</label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="outline" className={cn("justify-start text-left font-normal", !repeatUntil && "text-muted-foreground")}>
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {repeatUntil ? format(repeatUntil, "PPP") : "Pick a date"}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0">
                                                    <Calendar
                                                        mode="single"
                                                        selected={repeatUntil || undefined}
                                                        onSelect={setRepeatUntil}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    )}

                                    <div className="flex space-x-2">
                                        <Button onClick={() => onEdit(repeatOption, repeatUntil, editDate, editStartTime, editEndTime)}>
                                            Save
                                        </Button>
                                        <Button variant="outline" onClick={() => {
                                            setEditMode(false);
                                            // Reset to original values
                                            if (slot) {
                                                setEditDate(slot.date);
                                                setEditStartTime(slot.startTime);
                                                setEditEndTime(slot.endTime);
                                            }
                                        }}>
                                            Cancel
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <div className="flex space-x-2">
                                    <Button onClick={() => setEditMode(true)}>Edit</Button>
                                    <Button variant="destructive" onClick={onDelete}>Delete</Button>
                                </div>
                            )}
                        </div>
                    )}

                    {!isOwnSlot && (
                        <Button onClick={onBook}>Book This Slot</Button>
                    )}
                </div>
                <DialogFooter className="flex gap-2">
                    <Button variant="secondary" onClick={onClose}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 