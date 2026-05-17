import { XIcon, MessageSquareIcon, PhoneIcon, VideoIcon } from "lucide-react";
import ProfileAvatar from "./ProfileAvatar";

const UserProfileModal = ({ user, onClose, onStartVoiceCall, onStartVideoCall }) => {
  if (!user) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box p-0 overflow-hidden bg-base-100 max-w-sm border border-base-300 shadow-2xl text-base-content">
        {/* Header/Cover */}
        <div className="h-32 bg-gradient-to-br from-primary/30 to-secondary/30 relative">
          <button 
            className="btn btn-circle btn-sm absolute right-3 top-3 z-10 bg-black/20 hover:bg-black/40 border-none text-white transition-all"
            onClick={onClose}
          >
            <XIcon size={18} />
          </button>
        </div>

        {/* Profile Info */}
        <div className="px-6 pb-6 -mt-12 flex flex-col items-center">
          <div className="ring-offset-base-100 ring-4 ring-base-100 rounded-full mb-4 shadow-lg overflow-hidden">
             <ProfileAvatar src={user.image} size="w-24 h-24" textSize="text-3xl" name={user.name} />
          </div>
          
          <h2 className="text-2xl font-bold text-center text-base-content">{user.name}</h2>
          <p className="text-sm text-base-content/60 text-center mb-6">@{user.name?.toLowerCase().replace(/\s/g, '') || 'user'}</p>

          <div className="flex gap-2 mb-8 w-full">
            <button className="btn btn-primary flex-1 gap-2 shadow-sm" onClick={onClose}>
              <MessageSquareIcon size={18} />
              Message
            </button>
            <div className="flex gap-2">
               <button className="btn btn-ghost btn-circle border border-base-300 hover:bg-base-300" onClick={onStartVoiceCall}>
                 <PhoneIcon size={18} className="text-success" />
               </button>
               <button className="btn btn-ghost btn-circle border border-base-300 hover:bg-base-300" onClick={onStartVideoCall}>
                 <VideoIcon size={18} className="text-info" />
               </button>
            </div>
          </div>

          <div className="w-full space-y-4">

            
            <div className="text-sm space-y-3 px-1">
               <p className="flex flex-col gap-0.5">
                 <span className="text-xs font-bold text-base-content/50 uppercase tracking-wider">Bio</span>
                 <span className="text-base-content/90">Hey there! I am using Zashly.</span>
               </p>
               <p className="flex flex-col gap-0.5">
                 <span className="text-xs font-bold text-base-content/50 uppercase tracking-wider">Joined</span>
                 <span className="text-base-content/90 font-medium">
                    {user.createdAt 
                      ? new Intl.DateTimeFormat('en-US', { 
                          year: 'numeric', month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        }).format(new Date(user.createdAt))
                      : 'Recently'}
                  </span>
               </p>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop bg-black/40" onClick={onClose}></div>
    </div>
  );
};

export default UserProfileModal;
