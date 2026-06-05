import { ITCard, useITTheme } from "@axzydev/axzy_ui_system";
import { buildShades, colorHex, ThemeColor } from "../utils/theme.utils";

export const HomeCardItem = ({ item, index }: any) => {
  const { palette } = useITTheme();
  const accent: ThemeColor = item.accent ?? "primary";
  const hex = colorHex(palette, accent);
  const shades = buildShades(hex);

  return (
    <ITCard
      onClick={item.action}
      className="group bg-white rounded-xl border border-slate-200 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden hover:-translate-y-1"
      contentClassName="flex flex-col items-start gap-4 p-5"
      key={index}
    >
      <div
        className="h-11 w-11 rounded-xl flex items-center justify-center text-white shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md"
        style={{ backgroundColor: shades[600] }}
      >
        {item.icon}
      </div>

      <div className="space-y-1">
        <div className="text-sm font-extrabold text-slate-900 leading-tight">
          {item.title}
        </div>
        {item.description && (
          <div className="text-[11px] text-slate-500 leading-relaxed line-clamp-2 font-medium">
            {item.description}
          </div>
        )}
      </div>
    </ITCard>
  );
};
