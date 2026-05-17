import { useEffect } from "react";
import toast from "react-hot-toast";
import useSocket from "./useSocket";

const useGlobalAnnouncements = () => {
  const { on, off } = useSocket();

  useEffect(() => {
    const handleAnnouncement = (data) => {
      const { title, message, type } = data;

      const toastConfig = {
        duration: 8000,
        position: "top-center",
        className: "border border-primary/20",
      };

      if (type === "warning") {
        toast.error(
          <div>
            <strong>{title}</strong>
            <p className="text-sm mt-1">{message}</p>
          </div>,
          { ...toastConfig, icon: "⚠️" }
        );
      } else if (type === "error") {
        toast.error(
          <div>
            <strong>{title}</strong>
            <p className="text-sm mt-1">{message}</p>
          </div>,
          { ...toastConfig }
        );
      } else {
        toast.success(
          <div>
            <strong>{title}</strong>
            <p className="text-sm mt-1">{message}</p>
          </div>,
          { ...toastConfig, icon: "📢" }
        );
      }
    };

    const cleanup = on("global-announcement", handleAnnouncement);

    return () => {
      if (cleanup) cleanup();
    };
  }, [on, off]);
};

export default useGlobalAnnouncements;
