import { useMemo, useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Camera, MoreVertical, Trash } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteMoment, getAuthUser, getMoments, markMomentViewed } from "../lib/api";
import PremiumMomentViewer from "./moments/PremiumMomentViewer";
import CreateMomentFlow from "./moments/CreateMomentFlow";
import ProfileAvatar from "./ProfileAvatar";
import StatusRing from "./StatusRing";

export default function Moments() {
  const queryClient = useQueryClient();
  const { data: moments = [] } = useQuery({ queryKey: ["moments"], queryFn: getMoments });
  const { data: authUser } = useQuery({ 
    queryKey: ["authUser"], 
    queryFn: getAuthUser,
    retry: 1,
    staleTime: 1000 * 60 * 5, 
  });
  
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);

  const visibleMoments = useMemo(() => moments, [moments]);

  // Group moments by user for the tray
  const groupedUsers = useMemo(() => {
    const map = new Map();
    visibleMoments.forEach((m, idx) => {
      if (!map.has(m.userId)) {
        map.set(m.userId, {
          userId: m.userId,
          username: m.username,
          avatar: m.avatar,
          firstIndex: idx,
          moments: [],
          hasUnseen: false, // You can compute based on viewers array
        });
      }
      map.get(m.userId).moments.push(m);
    });
    return Array.from(map.values());
  }, [visibleMoments]);

  const authUserId = authUser?.user?._id || authUser?.user?.id || authUser?.user?.userId || authUser?._id || authUser?.id || authUser?.userId || "";

  // --- Mark as viewed
  const queryMark = useMutation({
    mutationFn: (id) => markMomentViewed(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["moments"] }),
  });

  const onSeen = useCallback((id) => {
    queryMark.mutate(id);
  }, [queryMark]);

  const openAt = (idx) => {
    setCurrentIndex(idx);
    setViewerOpen(true);
  };

  return (
    <section className="space-y-3 relative">
      <div className="flex items-center justify-between px-2 sm:px-0">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Moments</h2>
      </div>

      <div className="relative">
        <div className="flex items-start gap-3 sm:gap-4 overflow-x-auto no-scrollbar pt-2 pb-4 px-2 sm:px-0">
          
          {/* Create Tile */}
          <div className="shrink-0 flex flex-col items-center">
            <button 
              className="group cursor-pointer border-0 bg-transparent p-2 -m-2 outline-none relative"
              onClick={() => setCreateOpen(true)}
            >
              <div className="p-[2px] rounded-full bg-transparent">
                <div className="p-[2px] bg-base-100 rounded-full">
                  <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full overflow-hidden relative shadow-sm border border-base-100 group-hover:opacity-90 transition-opacity">
                    <ProfileAvatar 
                      src={authUser?.user?.profilePic || authUser?.profilePic} 
                      name={authUser?.user?.fullName || authUser?.fullName || "You"} 
                      size="w-full h-full" 
                    />
                  </div>
                </div>
              </div>
              {/* Plus Badge at Bottom Right */}
              <div className="absolute bottom-3 right-3 sm:bottom-3.5 sm:right-3.5 bg-blue-500 text-white rounded-full p-0.5 border-[2px] sm:border-[3px] border-base-100 shadow-sm group-hover:scale-110 transition-transform z-10">
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={3} />
              </div>
            </button>
            <div className="text-center text-[11px] sm:text-xs mt-0.5 font-medium opacity-80">Add Moment</div>
          </div>

          {/* Grouped Moments Tray */}
          {groupedUsers.map((group) => {
            const isOwner = String(group.userId) === String(authUserId);
            // If the user's moments are all seen, set isSeen = true. For now false.
            const isSeen = false; 

            // Find the representative moment for thumbnail (last one or first one)
            const rep = group.moments[0];

            return (
              <motion.div 
                key={group.userId} 
                className="shrink-0 flex flex-col items-center cursor-pointer p-2 -m-2"
                whileTap={{ scale: 0.95 }}
                onClick={() => openAt(group.firstIndex)}
                title={`${group.username}'s moments`}
              >
                <div className={`p-[2px] rounded-full ${isSeen ? 'bg-base-300' : 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600'}`}>
                  <div className="p-[2px] bg-base-100 rounded-full">
                    <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full overflow-hidden relative shadow-sm border border-base-100">
                      <ProfileAvatar 
                        src={group.avatar} 
                        name={group.username} 
                        size="w-full h-full" 
                      />
                    </div>
                  </div>
                </div>
                <div className="text-center text-[11px] sm:text-xs mt-0.5 font-medium opacity-80 max-w-[70px] truncate">
                  {isOwner ? "You" : group.username}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <PremiumMomentViewer
        open={viewerOpen}
        moments={visibleMoments}
        index={currentIndex}
        onClose={() => setViewerOpen(false)}
        onSeen={onSeen}
      />

      <CreateMomentFlow 
        isOpen={createOpen} 
        onClose={() => setCreateOpen(false)} 
      />
    </section>
  );
}
