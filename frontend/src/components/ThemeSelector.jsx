import { PaletteIcon, ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { useThemeStore } from "../store/useThemeStore";
import { THEMES } from "../constants";
import { useState } from "react";

const ThemeSelector = ({ variant = "dropdown" }) => {
  const { theme, setTheme } = useThemeStore();
  const [isExpanded, setIsExpanded] = useState(false);

  if (variant === "menuItem") {
    return (
      <div className="w-full">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center gap-3 p-2 hover:bg-base-300 rounded-lg transition-all text-sm w-full ${isExpanded ? 'bg-base-300' : ''}`}
        >
          <PaletteIcon className="size-4 opacity-70" />
          <span className="flex-1 text-left">Theme</span>
          {isExpanded ? (
            <ChevronDownIcon className="size-4 opacity-50" />
          ) : (
            <ChevronRightIcon className="size-4 opacity-50" />
          )}
        </button>

        {isExpanded && (
          <div className="mt-2 ml-7 space-y-1 animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 gap-1 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
              {THEMES.map((themeOption) => (
                <button
                  key={themeOption.name}
                  className={`
                    w-full px-3 py-2 rounded-lg flex items-center gap-3 transition-colors
                    ${
                      theme === themeOption.name
                        ? "bg-primary text-primary-content"
                        : "hover:bg-base-content/5 text-base-content/80"
                    }
                  `}
                  onClick={() => setTheme(themeOption.name)}
                >
                  <span className="text-xs font-medium truncate flex-1 text-left">{themeOption.label}</span>
                  <div className="flex gap-0.5">
                    {themeOption.colors.map((color, i) => (
                      <span
                        key={i}
                        className="size-1.5 rounded-full border border-white/10"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`dropdown ${variant === "sidebar" ? "dropdown-top w-full" : "dropdown-end"}`}>
      <button 
        tabIndex={0} 
        className={variant === "sidebar" 
          ? "btn btn-ghost justify-start w-full gap-3 px-3 normal-case btn-sm" 
          : "btn btn-ghost btn-circle"}
      >
        <PaletteIcon className={variant === "sidebar" ? "size-4 text-base-content opacity-70" : "size-5"} />
        {variant === "sidebar" && <span>Theme</span>}
      </button>

      <div
        tabIndex={0}
        className="dropdown-content mt-2 p-1 shadow-2xl bg-base-200 backdrop-blur-lg rounded-2xl
        w-56 border border-base-content/10 max-h-80 overflow-y-auto z-50"
      >
        <div className="space-y-1">
          {THEMES.map((themeOption) => (
            <button
              key={themeOption.name}
              className={`
              w-full px-4 py-3 rounded-xl flex items-center gap-3 transition-colors
              ${
                theme === themeOption.name
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-base-content/5"
              }
            `}
              onClick={() => setTheme(themeOption.name)}
            >
              <PaletteIcon className="size-4" />
              <span className="text-sm font-medium">{themeOption.label}</span>
              <div className="ml-auto flex gap-1">
                {themeOption.colors.map((color, i) => (
                  <span
                    key={i}
                    className="size-2 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ThemeSelector;
