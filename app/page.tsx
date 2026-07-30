"use client";

import { useState } from "react";
import Link from "next/link";

interface Table {
  id: number;
  name: string;
  status: "available" | "in-progress" | "waiting";
  players: number;
}

export default function Home() {
  const [tables] = useState<Table[]>([
    { id: 1, name: "Table 1", status: "available", players: 0 },
    { id: 2, name: "Table 2", status: "in-progress", players: 1 },
    { id: 3, name: "Table 3", status: "waiting", players: 1 },
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-black text-white">
      <header className="border-b border-white/10 backdrop-blur-sm bg-black/30 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center font-bold text-black text-2xl">
              8
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                Pool Hall Online
              </h1>
              <p className="text-xs text-gray-400">8-Ball Pool • 3 Tables Available</p>
            </div>
          </div>
          <div className="text-sm text-gray-400">
            <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
            {tables.reduce((a, t) => a + t.players, 0)} players online
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Choose Your Table</h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Join an 8-ball pool table and play against opponents from around the world.
            Choose a table below to start playing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tables.map((table) => (
            <Link
              key={table.id}
              href={`/pool/${table.id}`}
              className="group block"
            >
              <div className="bg-gray-900/60 border border-white/10 rounded-2xl p-6 hover:border-green-500/40 transition-all hover:shadow-2xl hover:shadow-green-500/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-800 to-green-950 border border-green-500/20 flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      table.status === "available"
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : table.status === "in-progress"
                        ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                        : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    }`}
                  >
                    {table.status === "available"
                      ? "Available"
                      : table.status === "in-progress"
                      ? "In Progress"
                      : "Waiting for Player"}
                  </span>
                </div>

                <h3 className="text-xl font-bold mb-2 group-hover:text-green-400 transition-colors">
                  {table.name}
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  {table.players === 0
                    ? "No players yet. Be the first!"
                    : `${table.players} player${table.players > 1 ? "s" : ""} playing`}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">8-Ball • Standard Rules</span>
                  <span className="text-green-400 text-sm font-medium group-hover:translate-x-1 transition-transform">
                    Join Table →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Click a table to play. Use mouse to aim and power up your shot.
          </div>
        </div>
      </main>
    </div>
  );
}
