export function StreakBanner({ currentStreak }: { currentStreak: number }) {
  if (currentStreak < 3) return null;
  
  return (
    <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="text-5xl">
              🔥
            </div>
            <div className="flex-1">
              <div className="font-bold text-2xl mb-1">
                {currentStreak} dana u nizu!
              </div>
              <p className="text-white/90">
                Super ti ide! Nastavi ovako i otključaj "Nepokolebljivi" bedž!
                🏆
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{currentStreak}</div>
              <div className="text-sm opacity-90">Streak</div>
            </div>
          </div>
        </div>
  );
}
