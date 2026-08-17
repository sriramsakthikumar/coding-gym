import React from 'react';
import { Layers } from 'lucide-react';

interface TopicMasteryItem {
  topic: string;
  total: number;
  solved: number;
  mastery_pct: number;
}

interface TopicRadarProps {
  topics: TopicMasteryItem[];
}

export const TopicRadar: React.FC<TopicRadarProps> = ({ topics }) => {
  const displayTopics = topics.slice(0, 8);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Topic Mastery Breakdown</h3>
            <p className="text-xs text-slate-400">Knowledge strength & focus areas</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {displayTopics.length > 0 ? (
          displayTopics.map((item, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">{item.topic}</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-[11px]">
                    {item.solved}/{item.total} solved
                  </span>
                  <span className="font-mono font-semibold text-blue-400 w-10 text-right">
                    {item.mastery_pct}%
                  </span>
                </div>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    item.mastery_pct >= 80
                      ? 'bg-emerald-500'
                      : item.mastery_pct >= 40
                      ? 'bg-blue-500'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.max(item.mastery_pct, 4)}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-slate-500 text-xs">
            Start solving problems to unlock topic mastery analytics.
          </div>
        )}
      </div>
    </div>
  );
};
