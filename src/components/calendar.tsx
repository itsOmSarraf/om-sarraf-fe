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

export default function Calendar() {
    const { user } = useUser();
    const [events, setEvents] = useState<EventInput[]>([]);
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);
    const [isInitialized, setIsInitialized] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Add color palette for different users
    const userColors = [
        "#34d399", // emerald
        "#f87171", // red
        "#60a5fa", // blue
        "#c084fc", // purple
        "#fbbf24", // amber
        "#34d399", // emerald
        "#f472b6", // pink
        "#818cf8", // indigo
        "#fb923c", // orange
        "#4ade80", // green
    ];

    // Get consistent color for a user
    const getUserColor = (userId: string) => {
        const colorIndex = Math.abs(userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % userColors.length;
        return userColors[colorIndex];
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

    // Modified generateFakeSlots function with minimal overlaps
    const generateFakeSlots = async () => {
        if (!user) return;
        console.log("Starting generateFakeSlots...");

        // Define time blocks throughout the day (30-minute intervals)
        const timeBlocks = [
            { start: "09:00", end: "09:30" },
            { start: "09:30", end: "10:00" },
            { start: "10:00", end: "10:30" },
            { start: "10:30", end: "11:00" },
            { start: "11:00", end: "11:30" },
            { start: "11:30", end: "12:00" },
            { start: "13:00", end: "13:30" },
            { start: "13:30", end: "14:00" },
            { start: "14:00", end: "14:30" },
            { start: "14:30", end: "15:00" },
            { start: "15:00", end: "15:30" },
            { start: "15:30", end: "16:00" },
            { start: "16:00", end: "16:30" },
            { start: "16:30", end: "17:00" },
            { start: "17:00", end: "17:30" },
            { start: "17:30", end: "18:00" }
        ];

        try {
            await db.slots.where('isFake').equals(1).delete();

            const fakeSlots = [];
            for (let day = 10; day <= 28; day++) {
                const dateStr = `2025-02-${day.toString().padStart(2, '0')}`;

                // Create a copy of timeBlocks for this day
                const availableBlocks = [...timeBlocks];

                // For each user, assign slots for this day
                for (const fakeUser of fakeUsers) {
                    // Each user gets 1-2 slots per day
                    const numberOfSlots = 1 + Math.floor(Math.random() * 2);

                    // If no more blocks available, skip this user for this day
                    if (availableBlocks.length === 0) continue;

                    for (let i = 0; i < numberOfSlots && availableBlocks.length > 0; i++) {
                        // Pick a random block
                        const blockIndex = Math.floor(Math.random() * availableBlocks.length);
                        const block = availableBlocks[blockIndex];

                        // Create a 30-minute or 1-hour slot
                        const isHourSlot = Math.random() < 0.3; // 30% chance of hour-long slot
                        let endBlock = block;

                        if (isHourSlot && blockIndex + 1 < availableBlocks.length) {
                            // Make it an hour slot if possible
                            endBlock = availableBlocks[blockIndex + 1];
                            // Remove both blocks
                            availableBlocks.splice(blockIndex, 2);
                        } else {
                            // Remove single block
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
            console.log("Added fake slots:", fakeSlots.length);
            await fetchAllSlots();
        } catch (error) {
            console.error("Error in generateFakeSlots:", error);
        }
    };

    // Modified fetchAllSlots with better error handling and colors
    const fetchAllSlots = async () => {
        if (!user) return;
        try {
            const allSlots = await db.slots.toArray();
            console.log("Total slots fetched:", allSlots.length);

            setEvents(
                allSlots.map((slot) => ({
                    id: String(slot.id),
                    title: slot.userId === user.id ? "Your Slot" : `Available: ${slot.userName}`,
                    start: `${slot.date}T${slot.startTime}`,
                    end: `${slot.date}T${slot.endTime}`,
                    allDay: false,
                    backgroundColor: slot.userId === user.id
                        ? "#2563eb"  // Your slots remain blue
                        : getUserColor(slot.userId),
                    borderColor: slot.userId === user.id
                        ? "none"  // Darker blue border for your slots
                        : "none",
                    textColor: "#000000",
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

        const newSlot = {
            userId: user.id,
            userName: user.fullName || 'User',
            date: selectionInfo.startStr.split("T")[0],
            startTime: selectionInfo.startStr.split("T")[1].substring(0, 5),
            endTime: selectionInfo.endStr.split("T")[1].substring(0, 5),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            isFake: false,
        };

        const id = await db.slots.add(newSlot);
        await fetchAllSlots();
        toast.success("Slot added successfully!");
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

    // Add new handlers
    const handleSlotEdit = async () => {
        // TODO: Implement edit functionality
        toast.success("Edit functionality coming soon!");
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

    // Add a temporary debug button
    const debugDatabase = async () => {
        const allSlots = await db.slots.toArray();
        console.log("All slots in database:", allSlots);
    };

    return (
        <div className="p-2 sm:p-6 bg-white rounded-lg shadow-md dark:bg-gray-900">
            <style>
                {`
                    /* Calendar container */
                    .fc {
                        --fc-border-color: #e5e7eb;
                        --fc-page-bg-color: transparent;
                    }
                    
                    .dark .fc {
                        --fc-border-color: #374151;
                        --fc-page-bg-color: transparent;
                        --fc-neutral-bg-color: #1f2937;
                        color: #e5e7eb;
                    }

                    /* Headers and text */
                    .dark .fc th {
                        color: #e5e7eb;
                        border-color: #374151;
                    }

                    .dark .fc-toolbar-title {
                        color: #e5e7eb;
                    }

                    /* Time slots */
                    .dark .fc-timegrid-slot {
                        border-color: #374151;
                    }

                    .dark .fc-timegrid-slot-lane {
                        background: #111827;
                    }

                    /* Today highlight */
                    .dark .fc .fc-day-today {
                        background: #1f2937 !important;
                    }

                    /* Event styles */
                    .fc-event {
                        border-radius: 4px;
                        padding: 2px 4px;
                        font-size: 0.875rem;
                    }

                    .my-slot {
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }

                    .other-slot {
                        opacity: 0.9;
                        transition: opacity 0.2s;
                    }

                    .other-slot:hover {
                        opacity: 1;
                    }

                    /* Buttons */
                    .dark .fc-button {
                        background: #374151 !important;
                        border-color: #4b5563 !important;
                        color: #e5e7eb !important;
                    }

                    .dark .fc-button:hover {
                        background: #4b5563 !important;
                    }

                    .dark .fc-button-active {
                        background: #6b7280 !important;
                    }

                    /* Time grid lines */
                    .dark .fc-timegrid-col {
                        border-color: #374151;
                    }

                    .dark .fc-timegrid-axis {
                        border-color: #374151;
                    }

                    /* Week numbers */
                    .dark .fc-day-header {
                        background: #1f2937;
                    }

                    /* Now indicator */
                    .dark .fc-timegrid-now-indicator-line {
                        border-color: #ef4444;
                    }

                    .dark .fc-timegrid-now-indicator-arrow {
                        border-color: #ef4444;
                        color: #ef4444;
                    }
                `}
            </style>
            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-gray-800 dark:text-white">Manage Your Availability</h2>
            <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView={windowWidth < 768 ? "timeGridDay" : "timeGridWeek"}
                editable={true}
                selectable={true}
                events={events}
                select={handleSlotAdd}
                eventClick={handleEventClick}
                headerToolbar={{
                    left: windowWidth < 640 ? 'prev,next' : 'prev,next today',
                    center: 'title',
                    right: windowWidth < 640
                        ? 'timeGridDay'  // Mobile: only show day view
                        : windowWidth < 1024
                            ? 'timeGridDay,timeGridWeek' // Tablet: show day and week views
                            : 'dayGridMonth,timeGridWeek,timeGridDay' // Desktop: show all views
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
                slotMinTime="06:00:00"
                slotMaxTime="22:00:00"
            />
            <SlotDetailsDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                slot={selectedSlot}
                isOwnSlot={selectedSlot?.userId === user?.id}
                onDelete={handleSlotDelete}
                onBook={handleSlotBook}
                onEdit={handleSlotEdit}
            />
            <div className="mt-4 flex justify-center gap-2">
                <Button onClick={handleClearSlots} variant="destructive" className="text-sm sm:text-base">
                    Clear My Slots
                </Button>
                {/* Temporary debug buttons */}
                <Button onClick={debugDatabase} variant="outline" className="text-sm sm:text-base">
                    Debug DB
                </Button>
                <Button onClick={resetDatabase} variant="outline" className="text-sm sm:text-base">
                    Reset DB
                </Button>
            </div>
        </div>
    );
}
