import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import { Dumbbell, Mail, Lock, ArrowRight, Target, Activity, Zap } from "lucide-react";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, signup, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
        toast.success("Welcome back!");
        navigate("/");
      } else {
        if (!name) throw new Error("Full Name is required.");
        await signup(email, password, name);
        toast.success("Account created successfully.");
        navigate("/onboarding");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    try {
      await signInWithGoogle();
      toast.success("Signed in with Google.");
      navigate("/");
    } catch (error) {
      toast.error("Sign in failed: " + error.message);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6 relative overflow-hidden">
      {/* Drifting Icons Background (Subtle Animation) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <Dumbbell className="floating-icon top-[15%] left-[10%] w-16 h-16" style={{ animationDelay: '0s', animationDuration: '12s' }} />
        <Target className="floating-icon top-[45%] left-[25%] w-12 h-12" style={{ animationDelay: '3s', animationDuration: '18s' }} />
        <Activity className="floating-icon bottom-[20%] left-[45%] w-10 h-10" style={{ animationDelay: '6s', animationDuration: '15s' }} />
        <Zap className="floating-icon top-[30%] right-[20%] w-20 h-20" style={{ animationDelay: '2s', animationDuration: '20s' }} />
        <Dumbbell className="floating-icon bottom-[35%] right-[10%] w-24 h-24" style={{ animationDelay: '8s', animationDuration: '14s' }} />
        <Target className="floating-icon top-[70%] left-[15%] w-14 h-14" style={{ animationDelay: '5s', animationDuration: '22s' }} />
      </div>

      <div className="w-full max-w-md z-10 animate-in fade-in zoom-in duration-700 mt-10">
        <div className="flex flex-col sm:flex-row items-center sm:gap-6 gap-4 mb-8 sm:px-4 text-center sm:text-left">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-linear-to-br from-primary to-primary-container rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/20 -rotate-6 transition-all hover:rotate-0 hover:scale-110 overflow-hidden border border-white/5">
            <img src="/logo.png" alt="FT" className="w-full h-full object-cover scale-110" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-4xl sm:text-5xl font-black italic uppercase tracking-tighter mb-1 select-none leading-none">
                Fit<span className="text-primary italic">Trackr</span>
            </h1>
            <p className="text-surface-variant font-label uppercase tracking-[0.3em] text-[8px] sm:text-[10px] font-bold ml-1">
                {isLogin ? "Welcome back" : "Join the movement"}
            </p>
          </div>
        </div>

        <Card className="no-line-card bg-surface-container-low/60 backdrop-blur-3xl border border-white/5 space-y-6 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-black italic uppercase tracking-tight">
                {isLogin ? "Log In" : "Sign Up"}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2 group animate-in slide-in-from-top-2 duration-300">
                <label className="text-[10px] font-label font-bold uppercase tracking-widest text-surface-variant ml-1">Full Name</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-variant group-focus-within:text-primary transition-colors flex items-center justify-center">
                    <Activity className="w-4 h-4" /> {/* Activity icon used as a placeholder for user icon */}
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    className="w-full bg-background border border-white/5 rounded-2xl py-5 pl-14 pr-4 text-on-background focus:ring-2 focus:ring-primary/50 focus:outline-none placeholder:text-surface-variant/50 font-label text-sm tracking-wide transition-all"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2 group">
              <label className="text-[10px] font-label font-bold uppercase tracking-widest text-surface-variant ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-variant group-focus-within:text-primary transition-colors" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="w-full bg-background border border-white/5 rounded-2xl py-5 pl-14 pr-4 text-on-background focus:ring-2 focus:ring-primary/50 focus:outline-none placeholder:text-surface-variant/50 font-label text-sm tracking-wide transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2 group">
              <label className="text-[10px] font-label font-bold uppercase tracking-widest text-surface-variant ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-variant group-focus-within:text-primary transition-colors" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-background border border-white/5 rounded-2xl py-5 pl-14 pr-4 text-on-background focus:ring-2 focus:ring-primary/50 focus:outline-none placeholder:text-surface-variant/50 font-label text-sm tracking-wide transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-4">
                <Button 
                    type="submit" 
                    className="w-full py-6 text-xl font-black italic uppercase shadow-xl shadow-primary/10 tracking-wider flex items-center justify-center"
                    disabled={loading}
                    size="lg"
                >
                    {loading ? "Processing..." : isLogin ? "Sign In" : "Get Started"}
                    {!loading && <ArrowRight className="ml-2 w-6 h-6" />}
                </Button>

                <div className="relative flex items-center justify-center py-4">
                    <div className="border-t border-white/5 w-full absolute" />
                    <span className="bg-surface px-4 text-[10px] font-label text-surface-variant z-10 uppercase tracking-[0.2em] font-bold">OR</span>
                </div>

                <Button 
                    type="button" 
                    variant="secondary"
                    onClick={handleGoogleSignIn}
                    className="w-full py-5 text-sm font-label uppercase font-bold tracking-widest gap-3 border-white/5 bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all active:scale-95"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                            fill="#EA4335"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            style={{ fill: "var(--color-primary)" }}
                        />
                        <path
                            fill="currentColor"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            opacity="0.3"
                        />
                        <path
                            fill="currentColor"
                            d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
                            opacity="0.3"
                        />
                        <path
                            fill="currentColor"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                            opacity="0.3"
                        />
                    </svg> 
                    Continue with Google
                </Button>
            </div>
          </form>

          <footer className="text-center pt-5 border-t border-white/5">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-surface-variant hover:text-primary transition-all text-xs font-label tracking-widest uppercase flex items-center justify-center gap-2 mx-auto font-bold"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
            </button>
          </footer>
        </Card>

        <p className="mt-10 text-center text-[9px] text-surface-variant/80 uppercase tracking-[0.4em] font-label font-bold">
          Fitness Analytics Ecosystem v1.0
        </p>
      </div>
    </div>
  );
}
