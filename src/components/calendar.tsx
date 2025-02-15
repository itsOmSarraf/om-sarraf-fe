"use client";

import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { db } from "@/lib/db"; // Import IndexedDB setup
import { useUser } from "@clerk/nextjs";
import { EventInput } from "@fullcalendar/core";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { fakeUsers } from "@/lib/fakelist";
import { SlotDetailsDialog } from "@/components/slot-details-dialog";
import { Slot } from "@/lib/db";
import "./calendar.css";
import {
    CALENDAR_COLORS,
    TIME_BLOCKS,
    CALENDAR_SETTINGS,
    PROBABILITY
} from "@/lib/constants/calendar";

// Add new types at the top of the file
type RepeatOption = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export default function Calendar() {
    const { user } = useUser();
    const [events, setEvents] = useState<EventInput[]>([]);
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);
    const [isInitialized, setIsInitialized] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [repeatOption, setRepeatOption] = useState<RepeatOption>('none');
    const [repeatUntil, setRepeatUntil] = useState<Date | null>(null);

    // Get consistent color for a user
    const getUserColor = (userId: string) => {
        const colorIndex = Math.abs(userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % CALENDAR_COLORS.userColors.length;
        return CALENDAR_COLORS.userColors[colorIndex];
    };

    // Get consistent border color for a user
    const getUserBorderColor = (userId: string) => {
        const colorIndex = Math.abs(userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % CALENDAR_COLORS.userBorderColors.length;
        return CALENDAR_COLORS.userBorderColors[colorIndex];
    };

    // Modified Clear All Slots handler
    const handleClearSlots = async () => {
        if (!user) return;
        // Only clear user's own slots, not fake slots
        await db.slots.where("userId").equals(user.id).delete();
        await fetchAllSlots();
        toast.success("Your slots have been cleared!");
    };

    // Add a function to reset the database
    const resetDatabase = async () => {
        try {
            await db.delete();
            window.location.reload();
        } catch (error) {
            console.error("Error resetting database:", error);
        }
    };

    // Modified generateFakeSlots function
    const generateFakeSlots = async () => {
        if (!user) return;
        console.log("Starting generateFakeSlots...");

        try {
            await db.slots.where('isFake').equals(1).delete();

            const fakeSlots = [];

            // Get current date and calculate range
            const today = new Date();
            const startDate = new Date(today);
            startDate.setDate(today.getDate() - 2);
            const endDate = new Date(today);
            endDate.setDate(today.getDate() + 2);

            // Loop through each day in the range
            for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
                const dateStr = date.toISOString().split('T')[0]; // Format: YYYY-MM-DD

                // Create a copy of timeBlocks for this day
                const availableBlocks = [...TIME_BLOCKS];

                // For each user, assign slots for this day
                for (const fakeUser of fakeUsers) {
                    const numberOfSlots = 1 + Math.floor(Math.random() * 2);

                    if (availableBlocks.length === 0) continue;

                    for (let i = 0; i < numberOfSlots && availableBlocks.length > 0; i++) {
                        const blockIndex = Math.floor(Math.random() * availableBlocks.length);
                        const block = availableBlocks[blockIndex];

                        const isHourSlot = Math.random() < PROBABILITY.hourLongSlot;
                        let endBlock = block;

                        if (isHourSlot && blockIndex + 1 < availableBlocks.length) {
                            endBlock = availableBlocks[blockIndex + 1];
                            availableBlocks.splice(blockIndex, 2);
                        } else {
                            availableBlocks.splice(blockIndex, 1);
                        }

                        fakeSlots.push({
                            userId: fakeUser.id,
                            userName: fakeUser.name,
                            date: dateStr,
                            startTime: block.start,
                            endTime: endBlock.end,
                            isFake: true,
                            timezone: "UTC"
                        });
                    }
                }
            }

            await db.slots.bulkPut(fakeSlots);
            await fetchAllSlots();
        } catch (error) {
            console.error("Error in generateFakeSlots:", error);
        }
    };

    // Update fetchAllSlots to use constants
    const fetchAllSlots = async () => {
        if (!user) return;
        try {
            const allSlots = await db.slots.toArray();

            setEvents(
                allSlots.map((slot) => ({
                    id: String(slot.id),
                    title: slot.userId === user.id ? "Your Slot" : `Available: ${slot.userName}`,
                    start: `${slot.date}T${slot.startTime}`,
                    end: `${slot.date}T${slot.endTime}`,
                    allDay: false,
                    backgroundColor: slot.userId === user.id
                        ? CALENDAR_COLORS.ownSlot.background
                        : getUserColor(slot.userId),
                    borderColor: slot.userId === user.id
                        ? CALENDAR_COLORS.ownSlot.border
                        : getUserBorderColor(slot.userId),
                    textColor: CALENDAR_COLORS.text,
                    editable: slot.userId === user.id,
                    classNames: slot.userId === user.id ? ['my-slot'] : ['other-slot'],
                }))
            );
        } catch (error) {
            console.error("Error in fetchAllSlots:", error);
        }
    };

    // Modified initialization useEffect
    useEffect(() => {
        if (!user || isInitialized) return;

        const initializeCalendar = async () => {
            try {
                console.log("Initializing calendar...");
                await generateFakeSlots();
                setIsInitialized(true);
            } catch (error) {
                console.error("Error initializing calendar:", error);
            }
        };

        initializeCalendar();
    }, [user, isInitialized]);

    // Add window resize listener
    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Handle new slot creation
    const handleSlotAdd = async (selectionInfo: any) => {
        if (!user) return;

        try {
            const newSlotDate = selectionInfo.startStr.split("T")[0];
            const newSlotStart = selectionInfo.startStr.split("T")[1].substring(0, 5);
            const newSlotEnd = selectionInfo.endStr.split("T")[1].substring(0, 5);

            // Check for existing slots by the same user that overlap with the new slot
            const existingSlots = await db.slots
                .where("userId")
                .equals(user.id)
                .and(slot => {
                    return slot.date === newSlotDate &&
                        !((slot.endTime <= newSlotStart) || (slot.startTime >= newSlotEnd));
                })
                .toArray();

            if (existingSlots.length > 0) {
                toast.error("You already have a slot during this time period!");
                return;
            }

            const newSlot = {
                userId: user.id,
                userName: user.fullName || 'User',
                date: newSlotDate,
                startTime: newSlotStart,
                endTime: newSlotEnd,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                isFake: false,
            };

            // Add the new slot to the database
            await db.slots.add(newSlot);

            // Refresh the calendar events
            await fetchAllSlots();
            toast.success("Slot added successfully!");
        } catch (error) {
            console.error("Error adding slot:", error);
            toast.error("Failed to add slot");
        }
    };

    // Modified handleSlotDelete
    const handleSlotDelete = async () => {
        if (!user || !selectedSlot) return;

        if (selectedSlot.userId === user.id) {
            await db.slots.delete(Number(selectedSlot.id));
            await fetchAllSlots();
            toast.success("Slot deleted!");
            setIsDialogOpen(false);
        } else {
            toast.error("You can only delete your own slots!");
        }
    };

    // Update the handleSlotEdit function
    const handleSlotEdit = async (
        repeatOption: RepeatOption = 'none',
        repeatUntil: Date | null = null,
        newDate?: string,
        newStartTime?: string,
        newEndTime?: string
    ) => {
        if (!user || !selectedSlot) return;

        if (selectedSlot.userId !== user.id) {
            toast.error("You can only edit your own slots!");
            return;
        }

        try {
            const event = events.find(e => e.id === String(selectedSlot.id));
            if (!event) return;

            // Use provided new values or get them from the event
            const startDateTime = new Date(event.start as string);
            const endDateTime = new Date(event.end as string);

            const newSlotDate = newDate || startDateTime.toISOString().split("T")[0];
            const newSlotStart = newStartTime || startDateTime.toTimeString().substring(0, 5);
            const newSlotEnd = newEndTime || endDateTime.toTimeString().substring(0, 5);

            // Generate repeated slots if a repeat option is selected
            const slotsToAdd = [];
            if (repeatOption !== 'none' && repeatUntil) {
                let currentDate = new Date(startDateTime);

                while (currentDate <= repeatUntil) {
                    const slotDate = currentDate.toISOString().split("T")[0];

                    // Skip the original slot date
                    if (slotDate !== newSlotDate) {
                        slotsToAdd.push({
                            userId: user.id,
                            userName: user.fullName || 'User',
                            date: slotDate,
                            startTime: newSlotStart,
                            endTime: newSlotEnd,
                            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                            isFake: false,
                        });
                    }

                    // Increment date based on repeat option
                    switch (repeatOption) {
                        case 'daily':
                            currentDate.setDate(currentDate.getDate() + 1);
                            break;
                        case 'weekly':
                            currentDate.setDate(currentDate.getDate() + 7);
                            break;
                        case 'monthly':
                            currentDate.setMonth(currentDate.getMonth() + 1);
                            break;
                        case 'yearly':
                            currentDate.setFullYear(currentDate.getFullYear() + 1);
                            break;
                    }
                }
            }

            // Check for overlapping slots including repeated slots
            const allDates = [newSlotDate, ...slotsToAdd.map(slot => slot.date)];
            const existingSlots = await db.slots
                .where("userId")
                .equals(user.id)
                .and(slot => {
                    return slot.id !== selectedSlot.id && // Exclude the current slot
                        allDates.includes(slot.date) &&
                        !((slot.endTime <= newSlotStart) || (slot.startTime >= newSlotEnd));
                })
                .toArray();

            if (existingSlots.length > 0) {
                toast.error("Some slots overlap with your existing slots!");
                await fetchAllSlots();
                return;
            }

            // Update the original slot
            await db.slots.update(selectedSlot.id!, {
                date: newSlotDate,
                startTime: newSlotStart,
                endTime: newSlotEnd
            });

            // Add repeated slots
            if (slotsToAdd.length > 0) {
                await db.slots.bulkAdd(slotsToAdd);
            }

            await fetchAllSlots();
            setIsDialogOpen(false);
            setEditMode(false);
            setRepeatOption('none');
            setRepeatUntil(null);
            toast.success("Slot(s) updated successfully!");
        } catch (error) {
            console.error("Error updating slot:", error);
            toast.error("Failed to update slot");
            await fetchAllSlots();
        }
    };

    // Add eventChange handler to FullCalendar component
    const handleEventChange = async (changeInfo: any) => {
        if (!user) return;

        const slotId = Number(changeInfo.event.id);
        const slot = await db.slots.get(slotId);

        if (!slot || slot.userId !== user.id) {
            toast.error("You can only edit your own slots!");
            await fetchAllSlots(); // Reset the calendar view
            return;
        }

        setSelectedSlot(slot);
        // Trigger the edit handler
        await handleSlotEdit();
    };

    const handleSlotBook = async () => {
        if (!selectedSlot) return;
        // TODO: Implement booking functionality
        toast.success(`Booking request sent to ${selectedSlot.userName}!`);
        setIsDialogOpen(false);
    };

    // Modified event click handler
    const handleEventClick = async (clickInfo: any) => {
        const slot = await db.slots.get(Number(clickInfo.event.id));
        if (slot) {
            setSelectedSlot(slot);
            setIsDialogOpen(true);
        }
    };

    return (
        <div className="p-2 sm:p-6 bg-white rounded-lg shadow-md dark:bg-gray-900">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-gray-800 dark:text-white">Manage Your Availability</h2>
            <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView={windowWidth < CALENDAR_SETTINGS.viewBreakpoints.mobile ? "timeGridDay" : "timeGridWeek"}
                editable={true}
                selectable={true}
                selectOverlap={true}
                selectConstraint={null}
                events={events}
                select={handleSlotAdd}
                eventClick={handleEventClick}
                eventChange={handleEventChange}
                headerToolbar={{
                    left: windowWidth < 640 ? 'prev,next' : 'prev,next today',
                    center: 'title',
                    right: windowWidth < 640
                        ? 'timeGridDay'
                        : windowWidth < CALENDAR_SETTINGS.viewBreakpoints.tablet
                            ? 'timeGridDay,timeGridWeek'
                            : 'dayGridMonth,timeGridWeek,timeGridDay'
                }}
                height="auto"
                stickyHeaderDates={true}
                dayMaxEvents={true}
                views={{
                    timeGridDay: {
                        titleFormat: { month: 'short', day: 'numeric' }
                    },
                    timeGridWeek: {
                        titleFormat: { month: 'short', day: 'numeric' },
                        dayHeaderFormat: windowWidth < 768 ? { weekday: 'short' } : { weekday: 'short', month: 'numeric', day: 'numeric' }
                    }
                }}
                slotMinTime={CALENDAR_SETTINGS.slotMinTime}
                slotMaxTime={CALENDAR_SETTINGS.slotMaxTime}
            />
            <SlotDetailsDialog
                isOpen={isDialogOpen}
                onClose={() => {
                    setIsDialogOpen(false);
                    setEditMode(false);
                    setRepeatOption('none');
                    setRepeatUntil(null);
                }}
                slot={selectedSlot}
                isOwnSlot={selectedSlot?.userId === user?.id}
                onDelete={handleSlotDelete}
                onBook={handleSlotBook}
                onEdit={handleSlotEdit}
                editMode={editMode}
                setEditMode={setEditMode}
                repeatOption={repeatOption}
                setRepeatOption={setRepeatOption}
                repeatUntil={repeatUntil}
                setRepeatUntil={setRepeatUntil}
            />
            <div className="mt-4 flex justify-center gap-2">
                <Button onClick={handleClearSlots} variant="destructive" className="text-sm sm:text-base">
                    Clear My Slots
                </Button>

                <Button onClick={resetDatabase} variant="outline" className="text-sm sm:text-base">
                    Reset DB
                </Button>
            </div>
        </div>
    );
}
