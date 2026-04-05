import React, { useEffect } from "react";
import Layout from "../components/common/Layout";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import { 
  Trophy, 
  Activity, 
  TrendingUp,
  Flame,
  Zap,
  ArrowRight
} from "lucide-react";
import { useUser } from "../contexts/UserContext";
import { useNavigate } from "react-router-dom";
import { requestNotificationPermission, onMessageListener } from "../services/notification.jsx";
import { Bell, BellRing, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { collection, query, where, orderBy, limit, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "../contexts/AuthContext";

export default function Dashboard() {
  const { userData, loading, updateProfile } = useUser();
  const navigate = useNavigate();

  const getHealthyRange = () => {
    if (!userData?.heightFt) return null;
    const ft = Math.abs(parseInt(userData.heightFt)) || 0;
    const inch = Math.abs(parseInt(userData.heightIn)) || 0;
    const totalInches = (ft * 12) + inch;
    const heightM = totalInches * 0.0254;
    
    if (heightM > 0) {
      const minW = 18.5 * (heightM * heightM);
      const maxW = 25.0 * (heightM * heightM);
      return { min: minW.toFixed(1), max: maxW.toFixed(1) };
    }
    return null;
  };

  const healthyRange = getHealthyRange();

  useEffect(() => {
    if (!loading && userData && !userData.profileComplete) {
      navigate("/onboarding");
    }

    if (userData?.profileComplete) {
      onMessageListener().catch(err => {});
    }
  }, [userData, loading, navigate]);

  const handleEnableNotifications = async () => {
    const token = await requestNotificationPermission();
    if (token) {
      await updateProfile({ 
        fcmToken: token,
        notificationsEnabled: true,
        notificationSyncedAt: new Date().toISOString()
      });
      toast.success("Notifications enabled!");
    } else {
      toast.error("Permission was not granted.");
    }
  };

  if (loading) return (
    <Layout>
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
    </Layout>
  );

  const [workouts, setWorkouts] = React.useState([]);
  const [workoutsLoading, setWorkoutsLoading] = React.useState(true);
  const [activeBar, setActiveBar] = React.useState(null); // Sticky tooltip state
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "workouts"),
      where("userId", "==", currentUser.uid),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const workoutData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setWorkouts(workoutData);
      setWorkoutsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const totalWorkouts = workouts.length;
  
  const totalWeight = workouts.reduce((acc, w) => 
    acc + w.exercises.reduce((exAcc, ex) => 
      exAcc + ex.sets.reduce((sAcc, s) => sAcc + parseFloat(s.weight || 0), 0), 0), 0);

  const peakStrength = workouts.reduce((acc, w) => {
    const sessionPeak = Math.max(...w.exercises.flatMap(ex => ex.sets.map(s => parseFloat(s.weight || 0))), 0);
    return Math.max(acc, sessionPeak);
  }, 0);
  const totalExercises = workouts.reduce((acc, w) => acc + w.exercises.length, 0);
  const estimatedActiveHours = (totalExercises * 15) / 60;
  
  const totalReps = workouts.reduce((acc, w) => 
    acc + w.exercises.reduce((exAcc, ex) => 
      exAcc + ex.sets.reduce((sAcc, s) => sAcc + parseInt(s.reps || 0), 0), 0), 0);
  const estimatedEnergyBurn = (totalReps * 0.5) + (totalWeight * 0.05) + (totalWorkouts * 50);

  const weeklyData = [
    { day: "Mon", weight: 0, peakWeight: 0, topEx: "", cal: 0, reps: 0 },
    { day: "Tue", weight: 0, peakWeight: 0, topEx: "", cal: 0, reps: 0 },
    { day: "Wed", weight: 0, peakWeight: 0, topEx: "", cal: 0, reps: 0 },
    { day: "Thu", weight: 0, peakWeight: 0, topEx: "", cal: 0, reps: 0 },
    { day: "Fri", weight: 0, peakWeight: 0, topEx: "", cal: 0, reps: 0 },
    { day: "Sat", weight: 0, peakWeight: 0, topEx: "", cal: 0, reps: 0 },
    { day: "Sun", weight: 0, peakWeight: 0, topEx: "", cal: 0, reps: 0 },
  ];

  const now = new Date();
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last14Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const currWeekLoad = workouts
    .filter(w => (w.timestamp?.toDate ? w.timestamp.toDate() : new Date(w.timestamp)) >= last7Days)
    .reduce((acc, w) => acc + w.exercises.reduce((exAcc, ex) => exAcc + ex.sets.reduce((sAcc, s) => sAcc + parseFloat(s.weight || 0), 0), 0), 0);

  const prevWeekLoad = workouts
    .filter(w => {
        const d = (w.timestamp?.toDate ? w.timestamp.toDate() : new Date(w.timestamp));
        return d >= last14Days && d < last7Days;
    })
    .reduce((acc, w) => acc + w.exercises.reduce((exAcc, ex) => exAcc + ex.sets.reduce((sAcc, s) => sAcc + parseFloat(s.weight || 0), 0), 0), 0);

  const progressDelta = prevWeekLoad > 0 
    ? ((currWeekLoad - prevWeekLoad) / prevWeekLoad * 100).toFixed(1) 
    : (currWeekLoad > 0 ? "100" : "0.0");

  const todayDate = new Date();
  const dayOfWeek = todayDate.getDay();
  const diffDate = todayDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const startOfWeek = new Date(todayDate.setDate(diffDate));
  startOfWeek.setHours(0, 0, 0, 0);

  const getGains = () => {
    const gains = [];
    const today = new Date();
    today.setHours(0,0,0,0);
    const lastWeekSameDay = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastWeekEnd = new Date(lastWeekSameDay.getTime() + 24 * 60 * 60 * 1000);

    const todayWorkouts = workouts.filter(w => {
       const d = w.timestamp?.toDate ? w.timestamp.toDate() : new Date(w.timestamp);
       d.setHours(0,0,0,0);
       return d.getTime() === today.getTime();
    });

    const prevWorkouts = workouts.filter(w => {
       const d = w.timestamp?.toDate ? w.timestamp.toDate() : new Date(w.timestamp);
       return d >= lastWeekSameDay && d < lastWeekEnd;
    });

    if (todayWorkouts.length > 0 && prevWorkouts.length > 0) {
      todayWorkouts[0].exercises.forEach(currEx => {
        const prevEx = prevWorkouts[0].exercises.find(e => e.name.toLowerCase() === currEx.name.toLowerCase());
        if (prevEx) {
          const currMax = Math.max(...currEx.sets.map(s => parseFloat(s.weight || 0)));
          const prevMax = Math.max(...prevEx.sets.map(s => parseFloat(s.weight || 0)));
          if (currMax >= prevMax) {
            gains.push({ 
                name: currEx.name, 
                delta: (currMax - prevMax).toFixed(1),
                curr: currMax,
                prev: prevMax
            });
          }
        }
      });
    }
    return gains;
  };

  const weeklyGains = getGains();

  workouts.forEach(w => {
    const wDate = w.timestamp?.toDate ? w.timestamp.toDate() : new Date(w.timestamp);
    if (wDate >= startOfWeek) {
      const dayName = wDate.toLocaleDateString('en-US', { weekday: 'short' });
      const dayItem = weeklyData.find(d => d.day === dayName);
      if (dayItem) {
        const sessionWeight = w.exercises.reduce((exAcc, ex) => 
             exAcc + ex.sets.reduce((sAcc, s) => sAcc + parseFloat(s.weight || 0), 0), 0);
        const sessionReps = w.exercises.reduce((exAcc, ex) => 
             exAcc + ex.sets.reduce((sAcc, s) => sAcc + parseInt(s.reps || 0), 0), 0);
        
        dayItem.weight += sessionWeight;
        dayItem.reps += sessionReps;
        dayItem.cal += (sessionReps * 0.5) + (sessionWeight * 0.05) + 50;

        w.exercises.forEach(ex => {
            const exPeak = Math.max(...ex.sets.map(s => parseFloat(s.weight || 0)));
            if (exPeak > dayItem.peakWeight) {
                dayItem.peakWeight = exPeak;
                dayItem.topEx = ex.name;
            }
        });
      }
    }
  });

  const hasData = workouts.length > 0;
  const maxWeeklyPeak = Math.max(...weeklyData.map(d => d.peakWeight)) || 1;

  const getPRs = () => {
    const allTime = {};
    const thisMonth = {};
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0,0,0,0);

    workouts.forEach(w => {
      const wDate = w.timestamp?.toDate ? w.timestamp.toDate() : new Date(w.timestamp);
      w.exercises.forEach(ex => {
        const name = ex.name.toUpperCase();
        const maxWeight = Math.max(...ex.sets.map(s => parseFloat(s.weight || 0)));
        
        if (!allTime[name] || maxWeight > allTime[name].weight) {
          allTime[name] = { weight: maxWeight, date: wDate };
        }
        
        if (wDate >= monthStart) {
          if (!thisMonth[name] || maxWeight > thisMonth[name].weight) {
            thisMonth[name] = { weight: maxWeight, date: wDate };
          }
        }
      });
    });

    return { allTime, thisMonth };
  };

  const { allTime, thisMonth } = getPRs();
  const prList = Object.entries(allTime).slice(0, 5).map(([name, data]) => ({
    name,
    weight: data.weight,
    isNew: thisMonth[name]?.weight === data.weight
  }));

  const hasDataOverall = workouts.length > 0;

  return (
    <Layout>
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-full overflow-hidden">
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2 border-b border-white/5 mb-2">
          <div className="space-y-3">
            <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter leading-none">
              Your <span className="text-primary italic">Dashboard</span>
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-surface-variant font-label uppercase tracking-widest text-[9.5px] sm:text-[11px] ml-1 font-bold">
              <span>Goal: <span className="text-primary underline decoration-primary/30 underline-offset-4">{userData?.goal?.toUpperCase() || "UNSET"}</span></span>
              <span className="hidden sm:inline w-1 h-1 bg-surface-variant/30 rounded-full" />
              <span>Weight: <span className="text-primary">{userData?.weight || 0}KG</span></span>
              <span className="hidden sm:inline w-1 h-1 bg-surface-variant/30 rounded-full" />
              <span>BMI: <span className={`${userData?.bmi >= 18.5 && userData?.bmi <= 25 ? 'text-primary' : 'text-orange-500'} font-black`}>{userData?.bmi || 0}</span></span>
              {healthyRange && (
                <>
                    <span className="hidden sm:inline w-1 h-1 bg-surface-variant/70 rounded-full" />
                    <span className="text-[9px] text-surface-variant opacity-90">Ideal Range: <span className="text-on-surface-variant">{healthyRange.min} - {healthyRange.max}KG</span></span>
                </>
              )}
            </div>
          </div>
          <Card className="flex items-center gap-6 py-4 px-8 border border-white/5 no-line-card bg-surface-container-low/40 group overflow-hidden relative">
            <div className="absolute inset-0 bg-primary/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            <div className="flex flex-col relative z-10">
              <span className="text-[9px] sm:text-[10px] font-label text-surface-variant uppercase tracking-widest font-bold">Your Progress</span>
              <span className="text-2xl sm:text-3xl font-black text-primary italic">
                {parseFloat(progressDelta) > 0 ? "+" : ""}{progressDelta}%
              </span>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center relative z-10">
                <Zap className={`text-primary w-5 h-5 sm:w-6 sm:h-6 ${parseFloat(progressDelta) > 0 ? 'animate-pulse' : ''}`} />
            </div>
          </Card>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Workouts" value={totalWorkouts} unit="Sessions" icon={Activity} color="var(--color-primary)" trend={(workouts.length > 0 ? "+100%" : "0%")} />
          <StatCard title="Peak Strength" value={peakStrength.toLocaleString()} unit="KG" icon={Trophy} color="var(--color-primary)" trend="PR" />
          <StatCard title="Total Load" value={totalWeight.toLocaleString()} unit="KG" icon={TrendingUp} color="var(--color-primary)" trend="Total" />
          <StatCard title="Energy Burn" value={estimatedEnergyBurn.toFixed(0)} unit="Kcal" icon={Flame} color="var(--color-primary)" trend="Est." />
        </section>
        
        {/* Weekly Gains (Same Day Comparison) */}
        {weeklyGains.length > 0 && (
            <section className="space-y-6 animate-in fade-in zoom-in duration-700">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold flex items-center gap-3 italic">
                        <span className="text-primary font-black">HIGH-VELOCITY</span> GAINS
                    </h2>
                    <span className="text-[10px] font-label text-surface-variant uppercase tracking-widest font-black">Vs Last Week Same Day</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {weeklyGains.map((gain, i) => (
                        <Card key={i} className="p-4 bg-surface-container-low/40 border-white/5 relative overflow-hidden group hover:border-primary/20 transition-colors">
                           <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-primary/10 transition-colors" />
                           <div className="flex items-center justify-between relative z-10">
                                <div>
                                    <h4 className="text-[11px] font-black italic uppercase tracking-wider text-surface-variant mb-1">{gain.name}</h4>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-black italic text-white tracking-tighter">{gain.curr}</span>
                                        <span className="text-[9px] uppercase font-label text-surface-variant font-bold">KG</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-1 text-primary mb-1 justify-end">
                                        <TrendingUp className="w-3 h-3" />
                                        <span className="text-xs font-black italic">+{gain.delta} KG</span>
                                    </div>
                                    <span className="text-[9px] font-label text-surface-variant uppercase tracking-[0.2em] font-black opacity-60">Prev: {gain.prev}kg</span>
                                </div>
                           </div>
                        </Card>
                    ))}
                </div>
            </section>
        )}

        <section className="animate-in slide-in-from-right-4 duration-700">
            <Card className="bg-linear-to-r from-primary/10 to-primary/5 border border-primary/20 p-6 sm:p-8 rounded-3xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10 transition-all">
                    <div className="flex items-center gap-6">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-xl ${userData?.notificationsEnabled ? 'bg-primary text-on-primary shadow-primary/30' : 'bg-surface-container-high text-surface-variant group-hover:text-primary scale-95 hover:scale-100'}`}>
                            {userData?.notificationsEnabled ? <BellRing className="w-8 h-8 animate-bounce" /> : <Bell className="w-8 h-8" />}
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-xl sm:text-2xl font-black italic uppercase tracking-tight leading-none">Workout <span className="text-primary italic">Reminders</span></h2>
                            <p className="text-[10px] sm:text-xs font-label uppercase tracking-widest text-surface-variant font-bold">Get notified about your next scheduled session</p>
                        </div>
                    </div>
                    {userData?.notificationsEnabled ? (
                        <div className="flex items-center gap-3 bg-primary/10 px-8 py-3 rounded-full border border-primary/20">
                            <CheckCircle className="text-primary w-5 h-5" />
                            <span className="text-[10px] font-black italic uppercase tracking-widest text-primary">Status: Ready to Train</span>
                        </div>
                    ) : (
                        <Button 
                            onClick={handleEnableNotifications}
                            className="px-12 py-3 text-[10px] sm:text-xs font-black italic uppercase tracking-widest leading-none shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all shrink-0"
                        >
                            Enable Notifications <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                    )}
                </div>
            </Card>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 space-y-8 bg-surface-container-low/40 relative">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-black italic uppercase tracking-tight">Weekly <span className="text-primary italic">Progress</span></h2>
              <Trophy className="text-primary/20 w-6 h-6" />
            </div>
            
            <div className="h-[250px] w-full flex items-end justify-between px-2 sm:px-4 pb-8 relative mt-4" onClick={() => setActiveBar(null)}>
                {!hasDataOverall && (
                    <div className="absolute inset-0 flex items-center justify-center z-20">
                        <p className="text-[10px] font-label uppercase tracking-[0.4em] text-surface-variant italic font-black opacity-80">No Workouts Logged yet</p>
                    </div>
                )}
                {weeklyData.map((d, i) => (
                    <div 
                        key={i} 
                        className="flex flex-col items-center gap-4 w-full h-full justify-end relative group"
                        onMouseEnter={() => setActiveBar(i)}
                        onMouseLeave={() => setActiveBar(null)}
                        onClick={(e) => {
                            e.stopPropagation();
                            setActiveBar(activeBar === i ? null : i);
                        }}
                    >
                        {/* Tooltip */}
                        {activeBar === i && (d.peakWeight > 0) && (
                            <div className="absolute bottom-[calc(100%-40px)] z-100 animate-in fade-in zoom-in duration-200 pointer-events-none">
                                <div className="bg-surface-container-highest border border-primary/30 p-3 rounded-2xl shadow-2xl min-w-[140px] space-y-2 translate-y-[-10px]">
                                    <p className="text-[9px] font-black italic text-primary uppercase border-b border-white/5 pb-1 flex items-center gap-2">
                                        <Trophy className="w-3 h-3" /> PR: {d.peakWeight}KG
                                    </p>
                                    <p className="text-[10px] font-bold text-white uppercase tracking-tighter truncate max-w-[120px]">{d.topEx || "Session"}</p>
                                    <div className="grid grid-cols-2 gap-2 pt-1">
                                        <div className="flex flex-col">
                                            <span className="text-[7px] text-surface-variant font-black uppercase flex items-center gap-1"><Flame className="w-2 h-2" /> Calories</span>
                                            <span className="text-[10px] text-white font-black italic">{d.cal.toFixed(0)} kcal</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[7px] text-surface-variant font-black uppercase flex items-center gap-1"><TrendingUp className="w-2 h-2" /> Total KG</span>
                                            <span className="text-[10px] text-white font-black italic">{d.weight.toLocaleString()} kg</span>
                                        </div>
                                    </div>
                                    <div className="pt-1 text-[8px] text-primary/60 font-black italic uppercase flex items-center gap-1">
                                        <Activity className="w-2 h-2" /> {d.reps} TOTAL REPS
                                    </div>
                                </div>
                                <div className="w-2 h-2 bg-surface-container-highest border-r border-b border-primary/30 rotate-45 mx-auto -translate-y-1"></div>
                            </div>
                        )}

                        <div className="relative w-8 sm:w-12 md:w-16 h-[80%] flex items-end">
                            <div 
                                className={`w-full rounded-t-xl transition-all duration-500 ease-out relative ${activeBar === i ? 'brightness-125' : ''}`}
                                style={{ 
                                    height: hasDataOverall && d.peakWeight > 0 ? `${(d.peakWeight / maxWeeklyPeak) * 100}%` : '4px',
                                    background: d.peakWeight > 0 ? 'linear-gradient(to top, var(--color-primary), #fbbf24)' : 'rgba(255,255,255,0.05)'
                                }}
                            >
                                {d.peakWeight > 0 && (
                                    <div className="absolute inset-0 bg-primary/20 blur-sm opacity-0 group-hover:opacity-100 transition-opacity rounded-t-xl shadow-[0_0_15px_rgba(249,115,22,0.4)]" />
                                )}
                            </div>
                        </div>
                        <span className={`text-[9px] sm:text-[10px] font-label uppercase font-black transition-colors ${activeBar === i ? 'text-primary' : 'text-surface-variant/40'}`}>
                            {d.day}
                        </span>
                    </div>
                ))}
            </div>
          </Card>

          <Card className="space-y-6 bg-primary/5 border border-primary/10 flex flex-col justify-between">
            <div className="space-y-6">
                <h2 className="text-xl sm:text-2xl font-black italic uppercase tracking-tight">Your <span className="text-primary italic">Records</span></h2>
                <div className="space-y-4">
                    {prList.length > 0 ? (
                        prList.map((pr, idx) => (
                            <PRItem key={idx} exercise={pr.name} weight={pr.weight} unit="KG" isNew={pr.isNew} />
                        ))
                    ) : (
                        <p className="text-[10px] font-label uppercase tracking-widest text-surface-variant italic font-black text-center py-10 opacity-40">Best lift records appear after your first workout</p>
                    )}
                </div>
            </div>
            <button 
                onClick={() => navigate("/history")}
                className="w-full flex items-center justify-center gap-2 text-primary font-label text-[9px] sm:text-[10px] uppercase tracking-widest pt-8 hover:scale-105 transition-transform font-black"
            >
              Access Full Workout History <ArrowRight className="w-4 h-4" />
            </button>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ title, value, unit, icon: Icon, color, trend }) {
  return (
    <Card className="no-line-card hover:translate-y-[-4px] group bg-surface-container-low/40">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-xl bg-surface-container-high text-on-surface-variant group-hover:text-primary transition-colors">
          <Icon className="w-5 h-5" style={{ color: trend.startsWith('+') ? color : undefined }} />
        </div>
        <span className={`text-[10px] font-black px-2 py-1 rounded bg-black/40 ${trend.startsWith('+') ? 'text-primary' : 'text-error'}`}>
          {trend}
        </span>
      </div>
      <div className="space-y-1">
        <h3 className="text-[10px] font-label text-surface-variant uppercase tracking-widest font-black">{title}</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black italic tracking-tighter">{value}</span>
          <span className="text-[10px] font-label text-surface-variant uppercase italic font-bold">{unit}</span>
        </div>
      </div>
    </Card>
  );
}

function PRItem({ exercise, weight, unit, isNew }) {
  return (
    <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5 hover:border-primary/30 transition-colors group relative overflow-hidden">
      {isNew && <div className="absolute top-0 right-0 bg-primary text-[6px] font-black italic uppercase px-2 py-0.5 rounded-bl-lg text-on-primary">NEW MONTH BEST</div>}
      <div className="space-y-1">
        <p className="text-sm font-label uppercase tracking-wider text-on-surface-variant group-hover:text-primary transition-colors font-black italic">{exercise}</p>
        <p className="text-[9px] font-label text-surface-variant uppercase font-bold">ALL-TIME BEST</p>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-black italic">{weight}</span>
        <span className="text-[10px] font-label text-surface-variant uppercase italic font-bold">{unit}</span>
      </div>
    </div>
  );
}
