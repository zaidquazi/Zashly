/**
 * Reusable profile avatar component.
 * Shows the user's profile picture if available,
 * otherwise shows the first letter of their name in a colored circle.
 */
const ProfileAvatar = ({ src, name, size = "w-10 h-10", textSize = "text-base", className = "" }) => {
  const initial = name?.trim()?.[0]?.toUpperCase() || "?";

  // Generate a consistent color based on the name
  const getColor = (name) => {
    if (!name) return "from-primary to-secondary";
    const colors = [
      "from-rose-500 to-pink-500",
      "from-violet-500 to-purple-500",
      "from-blue-500 to-cyan-500",
      "from-emerald-500 to-teal-500",
      "from-amber-500 to-orange-500",
      "from-indigo-500 to-blue-500",
      "from-fuchsia-500 to-pink-500",
      "from-sky-500 to-indigo-500",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  if (src) {
    return (
      <div className={`${size} rounded-full overflow-hidden shrink-0 ${className}`}>
        <img
          src={src}
          alt={name || "User Avatar"}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  return (
    <div
      className={`${size} rounded-full bg-gradient-to-br ${getColor(name)} flex items-center justify-center shrink-0 ${className}`}
    >
      <span className={`${textSize} font-bold text-white select-none`}>
        {initial}
      </span>
    </div>
  );
};

export default ProfileAvatar;
