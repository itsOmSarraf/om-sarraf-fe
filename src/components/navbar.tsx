"use client";

import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Navbar() {
    const { user } = useUser();

    return (
        <nav className="flex items-center justify-between px-6 py-4 bg-white shadow-md dark:bg-gray-900">
            <Link href="/" className="text-2xl font-semibold text-gray-800 dark:text-white">
                Slot Booking
            </Link>

            {/* <div className="hidden md:flex space-x-6">
                <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                    Dashboard
                </Link>
                <Link href="/about" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                    About
                </Link>
            </div> */}

            <div className="flex items-center space-x-4">
                <SignedOut>
                    <SignInButton mode="modal" forceRedirectUrl={"/dashboard"}>
                        <Button>Sign In</Button>
                    </SignInButton>
                </SignedOut>

                <SignedIn>
                    <ThemeToggle />
                    <UserButton />
                </SignedIn>
            </div>
        </nav>
    );
}
