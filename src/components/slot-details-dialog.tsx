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

interface SlotDetailsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    slot: Slot | null;
    isOwnSlot: boolean;
    onDelete?: () => void;
    onBook?: () => void;
    onEdit?: () => void;
}

export function SlotDetailsDialog({
    isOpen,
    onClose,
    slot,
    isOwnSlot,
    onDelete,
    onBook,
    onEdit,
}: SlotDetailsDialogProps) {
    if (!slot) return null;

    const formattedDate = format(new Date(slot.date), 'MMMM do, yyyy');

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
                    {slot.timezone && (
                        <div className="text-sm text-muted-foreground">
                            Timezone: {slot.timezone}
                        </div>
                    )}
                </div>
                <DialogFooter className="flex gap-2">
                    {isOwnSlot ? (
                        <>
                            <Button variant="outline" onClick={onEdit}>
                                Edit
                            </Button>
                            <Button variant="destructive" onClick={onDelete}>
                                Delete
                            </Button>
                        </>
                    ) : (
                        <Button onClick={onBook}>Book This Slot</Button>
                    )}
                    <Button variant="secondary" onClick={onClose}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 