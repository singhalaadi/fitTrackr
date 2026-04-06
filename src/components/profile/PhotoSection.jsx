import { Camera, UploadCloud } from "lucide-react";

export default function PhotoSection({ 
    profileImage, 
    fileInputRef, 
    handleImageUpload 
}) {
  return (
    <section className="space-y-6 flex flex-col">
      <h2 className="text-lg font-bold flex items-center gap-3 italic">
        <span className="text-primary font-black">01 /</span> Profile Picture
      </h2>
      <div className="relative group w-full aspect-square max-w-[240px] sm:max-w-[280px] mx-auto sm:mx-0">
        <div className={`
          w-full h-full rounded-3xl overflow-hidden border-2 border-dashed transition-all duration-500
          ${profileImage ? "border-primary" : "border-white/10 hover:border-primary"}
          bg-surface-container-low flex items-center justify-center
        `}>
          {profileImage ? (
            <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-3 text-surface-variant">
              <Camera className="w-10 h-10 sm:w-12 sm:h-12 opacity-20" />
              <span className="text-[9px] sm:text-[10px] font-label uppercase tracking-widest font-black opacity-30">No Data</span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="absolute -bottom-3 -right-3 sm:-bottom-4 sm:-right-4 p-4 sm:p-5 rounded-2xl bg-primary text-on-primary shadow-xl shadow-primary/30 hover:scale-110 active:scale-95 transition-all"
        >
          <UploadCloud className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <input 
            type="file" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            accept="image/*" 
        />
      </div>
    </section>
  );
}
