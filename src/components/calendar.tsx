"use client";

import { useEffect, useState, useRef } from "react";
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
import { CopyDayDialog } from "@/components/copy-day-dialog";
import { Select } from "@/components/ui/select";
import {
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Add new types at the top of the file
type RepeatOption = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

// Add this type definition near other types
type TimezoneOption = {
    value: string;
    label: string;
};

export default function Calendar() {
    const { user } = useUser();
    const calendarRef = useRef<any>(null);
    const [events, setEvents] = useState<EventInput[]>([]);
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);
    const [isInitialized, setIsInitialized] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [repeatOption, setRepeatOption] = useState<RepeatOption>('none');
    const [repeatUntil, setRepeatUntil] = useState<Date | null>(null);
    const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [currentTimezone, setCurrentTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
    const [timezoneOptions, setTimezoneOptions] = useState<TimezoneOption[]>([]);

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

    // Add this useEffect to initialize timezone options
    useEffect(() => {
        // Get all timezone names
        const timezonesRaw = Intl.supportedValuesOf('timeZone');
        const options = timezonesRaw.map(tz => ({
            value: tz,
            label: tz.replace(/_/g, ' ')
        }));
        setTimezoneOptions(options);
    }, []);

    // Modify the fetchAllSlots function to handle timezone conversion
    const fetchAllSlots = async () => {
        if (!user) return;
        try {
            const allSlots = await db.slots.toArray();

            setEvents(
                allSlots.map((slot) => {
                    // Convert the slot times from their original timezone to the selected timezone
                    const startDate = new Date(`${slot.date}T${slot.startTime}`);
                    const endDate = new Date(`${slot.date}T${slot.endTime}`);

                    // Create Date objects in the original timezone
                    const originalStart = new Date(startDate.toLocaleString('en-US', { timeZone: slot.timezone }));
                    const originalEnd = new Date(endDate.toLocaleString('en-US', { timeZone: slot.timezone }));

                    // Convert to the current selected timezone
                    const convertedStart = new Date(originalStart.toLocaleString('en-US', { timeZone: currentTimezone }));
                    const convertedEnd = new Date(originalEnd.toLocaleString('en-US', { timeZone: currentTimezone }));

                    return {
                        id: String(slot.id),
                        title: slot.userId === user.id ? "Your Slot" : `Available: ${slot.userName}`,
                        start: convertedStart,
                        end: convertedEnd,
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
                    };
                })
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
    }, [user, isInitialized, generateFakeSlots]); // Added generateFakeSlots to dependency array

    // Add window resize listener
    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Add timezone change handler
    const handleTimezoneChange = (newTimezone: string) => {
        setCurrentTimezone(newTimezone);
        // Refetch and convert slots when timezone changes
        fetchAllSlots();
    };

    // Handle new slot creation
    const handleSlotAdd = async (selectionInfo: any) => {
        if (!user) return;

        try {
            const newSlotDate = selectionInfo.startStr.split("T")[0];
            const newSlotStart = selectionInfo.startStr.split("T")[1].substring(0, 5);
            const newSlotEnd = selectionInfo.endStr.split("T")[1].substring(0, 5);

            // Store the slot in the current timezone
            const newSlot = {
                userId: user.id,
                userName: user.fullName || 'User',
                date: newSlotDate,
                startTime: newSlotStart,
                endTime: newSlotEnd,
                timezone: currentTimezone, // Use current timezone
                isFake: false,
            };

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

            await db.slots.update(selectedSlot.id!, {
                date: newDate || event.start?.toString().split('T')[0],
                startTime: newStartTime || event.start?.toString().split('T')[1].substring(0, 5),
                endTime: newEndTime || event.end?.toString().split('T')[1].substring(0, 5)
            });

            await fetchAllSlots();
            setIsDialogOpen(false);
            setEditMode(false);
            toast.success("Slot updated successfully!");
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

    // Replace the entire handleCopyDay function with this corrected version
    const handleCopyDay = async (date: Date) => {
        if (!user) return;

        try {
            // Get the selected date from the calendar API to ensure correct date
            const calendarApi = calendarRef.current.getApi();
            const selectedDate = calendarApi.getDate();
            const selectedDateStr = selectedDate.toISOString().split('T')[0];

            // Find events for the selected date from the events state
            const todaysEvents = events.filter(event => {
                const eventDate = new Date(event.start as Date);
                return eventDate.toISOString().split('T')[0] === selectedDateStr &&
                    event.title === "Your Slot"; // Only get the user's own slots
            });

            if (todaysEvents.length === 0) {
                toast.error("You don't have any availability set for this day");
                return;
            }

            // Format the date
            const formattedDate = selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
            });

            // Format the slots
            const formattedSlots = todaysEvents
                .sort((a, b) => {
                    const aStart = new Date(a.start as Date);
                    const bStart = new Date(b.start as Date);
                    return aStart.getTime() - bStart.getTime();
                })
                .map(event => {
                    const start = new Date(event.start as Date);
                    const end = new Date(event.end as Date);

                    return {
                        start: start.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                            timeZone: currentTimezone
                        }),
                        end: end.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                            timeZone: currentTimezone
                        })
                    };
                });

            const message = `My availability for ${formattedDate}:\n` +
                formattedSlots.map(slot => `${slot.start} - ${slot.end}`).join('\n') +
                `\nTimezone: ${currentTimezone}`;

            await navigator.clipboard.writeText(message);
            toast.success('Your availability has been copied to clipboard!');

        } catch (error) {
            console.error('Error copying availability:', error);
            toast.error('Failed to copy availability');
        }
    };

    return (
        <div className="p-2 sm:p-6 bg-white rounded-lg shadow-md dark:bg-gray-900">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
                    Manage Your Availability
                </h2>
                <Select
                    value={currentTimezone}
                    onValueChange={handleTimezoneChange}
                >
                    <SelectTrigger className="w-[280px]">
                        <SelectValue placeholder="Select Timezone" />
                    </SelectTrigger>
                    <SelectContent>
                        {timezoneOptions.map((tz) => (
                            <SelectItem key={tz.value} value={tz.value}>
                                {tz.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="timeGridDay"
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
                        ? 'timeGridDay copyDay'
                        : windowWidth < CALENDAR_SETTINGS.viewBreakpoints.tablet
                            ? 'timeGridDay,timeGridWeek copyDay'
                            : 'timeGridDay,timeGridWeek,dayGridMonth copyDay'
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
                customButtons={{
                    copyDay: {
                        text: 'Copy Day',
                        click: () => {
                            if (calendarRef.current) {
                                const calendarApi = calendarRef.current.getApi();
                                setSelectedDate(calendarApi.getDate());
                                setIsCopyDialogOpen(true);
                            }
                        }
                    }
                }}
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
            <CopyDayDialog
                isOpen={isCopyDialogOpen}
                onClose={() => setIsCopyDialogOpen(false)}
                sourceDate={selectedDate}
                onCopy={handleCopyDay}
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
