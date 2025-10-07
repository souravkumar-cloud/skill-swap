"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useState } from "react";
import SignOut from "../(auth)/SignOut/SignOut";

export default function Home() {
  const { data: session, status } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState("No bio yet. Add something about yourself!");
  const [skills, setSkills] = useState("No teaching skills added yet");

  if (status === "unauthenticated") {
    return redirect("/login");
  }
  if (!session) {
    return <p>Loading...</p>;
  }

  const { user } = session;
  const formattedDate = new Date(session.expires).toLocaleString();

  const handleToggleEdit = () => {
    setIsEditing((prev) => !prev);
  };

  const handleSave = () => {
    // here you could send `bio` and `skills` to your backend via API
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Profile Header */}
      <div className="bg-gray-800 rounded-xl p-6 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center">
              <svg
                className="w-10 h-10 text-gray-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z" />
              </svg>
            </div>
            <div className="absolute bottom-0 right-0 bg-blue-600 p-1 rounded-full">
              <svg
                className="w-4 h-4 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M12.293 7.293a1 1 0 011.414 0L17 10.586a2 2 0 010 2.828l-3.293 3.293a1 1 0 11-1.414-1.414L15.586 12l-2.879-2.879a1 1 0 010-1.414zM7.707 12.707a1 1 0 01-1.414 0L3 10.414a2 2 0 010-2.828L6.293 4.293a1 1 0 011.414 1.414L4.414 9l2.879 2.879a1 1 0 010 1.414z" />
              </svg>
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold">{user?.name || "SOURAV KUMAR"}</h1>
            <p className="text-blue-400">{user?.email || "sokukumar678@gmail.com"}</p>
          </div>
        </div>

        {/* Edit / Save Button */}
        <button
          onClick={isEditing ? handleSave : handleToggleEdit}
          className={`${
            isEditing
              ? "bg-green-600 hover:bg-green-500"
              : "bg-gray-700 hover:bg-gray-600"
          } px-4 py-2 rounded text-sm flex items-center gap-2 transition`}
        >
          <svg
            className="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            {isEditing ? (
              <path d="M5 13l4 4L19 7" /> // check icon
            ) : (
              <path d="M3 17.25V21h3.75l11.06-11.06-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 000-1.42l-2.34-2.34a1.003 1.003 0 00-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" />
            )}
          </svg>
          {isEditing ? "Save Profile" : "Edit Profile"}
        </button>
      </div>

      {/* Info Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {/* About Me */}
        <div className="bg-gray-800 p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-2 border-b border-gray-600 pb-2">
            About Me
          </h2>
          {isEditing ? (
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-gray-700 text-gray-200 p-3 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
            />
          ) : (
            <p className="text-gray-400 whitespace-pre-line">{bio}</p>
          )}
        </div>

        {/* Skills */}
        <div className="bg-gray-800 p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-2 border-b border-gray-600 pb-2">
            My Skills
          </h2>
          <h3 className="text-purple-400 font-semibold">I Can Teach</h3>
          {isEditing ? (
            <textarea
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              className="w-full bg-gray-700 text-gray-200 p-3 rounded resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={3}
            />
          ) : (
            <p className="text-gray-400 whitespace-pre-line">{skills}</p>
          )}
        </div>
      </div>
    </div>
  );
}
