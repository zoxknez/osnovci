/**
 * Homework Stats Component
 * Quick statistics display for homework
 */

"use client";

interface HomeworkStatsProps {
  active: number;
  completed: number;
  urgent: number;
}

export function HomeworkStats({ active, completed, urgent }: HomeworkStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-blue-700">
          {active}
        </span>
        <span className="text-xs font-medium text-blue-600 uppercase tracking-wider mt-1">Aktivni</span>
      </div>
      <div className="bg-green-50 rounded-xl p-4 border border-green-100 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-green-700">
          {completed}
        </span>
        <span className="text-xs font-medium text-green-600 uppercase tracking-wider mt-1">Urađeni</span>
      </div>
      <div className="bg-red-50 rounded-xl p-4 border border-red-100 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-red-700">
          {urgent}
        </span>
        <span className="text-xs font-medium text-red-600 uppercase tracking-wider mt-1">Hitni</span>
      </div>
    </div>
  );
}

