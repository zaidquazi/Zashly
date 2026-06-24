const DeviceManagementView = () => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Device Management</h2>
        <p className="text-base-content/70">
          Monitor active sessions, view suspicious devices, and revoke access.
        </p>
      </div>

      <div className="card bg-base-200 border border-base-300 shadow-sm p-12 flex flex-col items-center justify-center text-center">
        <div className="size-16 bg-base-300 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">📱</span>
        </div>
        <h3 className="text-xl font-bold mb-2">Active Sessions</h3>
        <p className="text-base-content/60 max-w-md mx-auto">
          This dashboard will allow you to see all active device sessions across the platform and forcefully log out suspicious or compromised accounts.
        </p>
      </div>
    </div>
  );
};

export default DeviceManagementView;
