const BannedUsersView = () => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Banned Users</h2>
        <p className="text-base-content/70">
          View all banned users, check ban reasons, and manage unbans.
        </p>
      </div>

      <div className="card bg-base-200 border border-base-300 shadow-sm p-12 flex flex-col items-center justify-center text-center">
        <div className="size-16 bg-base-300 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">🚫</span>
        </div>
        <h3 className="text-xl font-bold mb-2">Ban Management</h3>
        <p className="text-base-content/60 max-w-md mx-auto">
          Here you will be able to search through all banned accounts, read moderation notes, and lift bans if an appeal is successful.
        </p>
      </div>
    </div>
  );
};

export default BannedUsersView;
