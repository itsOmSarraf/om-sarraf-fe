'use client'
// app/page.tsx
import { SignInButton, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const handleClick = () => {
    if (isSignedIn) {
      router.push("/dashboard");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-700 px-4">
      <div className="max-w-2xl text-center">
        <h1 className="mb-6 text-5xl font-bold text-white">
          Welcome to the Slot Booking App
        </h1>
        <p className="mb-8 text-lg text-gray-100">
          This project is for the <strong>Zelthy Frontend Internship Assignment</strong> by Om Sarraf (
          <a
            href="https://itsomsarraf.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-yellow-300 underline hover:text-yellow-400"
          >
            itsomsarraf.com
          </a>
          ). It is built using <strong>Clerk</strong>, <strong>IndexedDB (via Dexie)</strong>,{" "}
          <strong>ShadCN</strong>, <strong>Next.js</strong>, and <strong>Tailwind CSS</strong>.
        </p>
        {isSignedIn ? (
          <button
            onClick={handleClick}
            className="px-5 py-2 text-xl font-semibold rounded bg-white text-gray-800 hover:bg-gray-100"
          >
            Try It
          </button>
        ) : (
          <SignInButton mode="modal" forceRedirectUrl={"/dashboard"}>
            <button className="px-5 py-2 text-xl font-semibold rounded bg-white text-gray-800 hover:bg-gray-100">
              Try It
            </button>
          </SignInButton>
        )}
      </div>
    </div>
  );
}
