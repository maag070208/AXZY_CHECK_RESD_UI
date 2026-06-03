import { ITCard, ITText } from "@axzydev/axzy_ui_system";

export const HomeCardItem = ({ item, index }: any) => {
  return (
    <ITCard
      onClick={item.action}
      className="group transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-500/10 border border-slate-100 rounded-2xl transition-all duration-500 overflow-hidden cursor-pointer relative bg-white"
      contentClassName="h-full flex flex-col p-6 min-h-[160px] justify-between relative z-10"
      key={index}
    >
      {/* Hover Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-white to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Top Animated Line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />

      <div className="flex items-center justify-between w-full relative z-10">
        <div className="h-14 w-14 rounded-2xl bg-emerald-50/80 text-emerald-600 flex items-center justify-center border border-emerald-100/50 shadow-sm group-hover:bg-emerald-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-emerald-200 transition-all duration-500">
          <div className="text-[22px] flex items-center justify-center">
            {item.icon}
          </div>
        </div>

        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:border-emerald-100 transition-colors duration-500">
          <div className="w-2 h-2 rounded-full bg-slate-200 group-hover:bg-emerald-400 transition-colors duration-500" />
        </div>
      </div>

      <div className="mt-6 space-y-1 relative z-10">
        <ITText className="text-base font-black text-slate-800 uppercase tracking-tight group-hover:text-emerald-700 transition-colors duration-300">
          {item.title}
        </ITText>
        {item.description && (
          <ITText className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed line-clamp-2">
            {item.description}
          </ITText>
        )}
      </div>
    </ITCard>
  );
};
