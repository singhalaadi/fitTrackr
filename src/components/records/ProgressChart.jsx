import { useState, useEffect } from "react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { Target } from "lucide-react";
import Card from "../common/Card";

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-container-high border border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-md">
        <p className="text-[10px] font-label text-surface-variant uppercase tracking-widest font-black mb-1">{payload[0].payload.date}</p>
        <p className="text-xl font-black italic text-primary">{payload[0].value} <span className="text-[10px] not-italic text-surface-variant">KG</span></p>
      </div>
    );
  }
  return null;
};

export default function ProgressChart({ selectedExercise, data }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Card className="p-8 sm:p-10 bg-surface-container-low/40 border-white/5 min-h-[450px] flex flex-col transition-all overflow-hidden">
      <div className="flex items-center justify-between mb-8 sm:mb-10">
        <div>
          <h3 className="text-2xl font-black italic uppercase tracking-tight text-white">{selectedExercise} <span className="text-primary italic">Gains</span></h3>
          <p className="text-[9px] font-label text-surface-variant uppercase tracking-widest font-bold mt-1">Peak Weight Progression</p>
        </div>
        <Target className="text-primary/10 w-12 h-12" />
      </div>

      <div className="flex-1 w-full min-h-[350px] relative pointer-events-auto">
        {mounted ? (
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 700 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 700 }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--color-primary)', strokeWidth: 1 }} />
              <Area 
                type="monotone" 
                dataKey="weight" 
                stroke="var(--color-primary)" 
                strokeWidth={4}
                fillOpacity={1} 
                fill="url(#colorWeight)" 
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-[350px] flex items-center justify-center">
             <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          </div>
        )}
      </div>
    </Card>
  );
}
