import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { acceptFriendRequest, rejectFriendRequest, getFriendRequests, getNotifications, markAllNotificationsRead } from "../lib/api";
import { formatDistanceToNow } from "date-fns";

import {
  BellIcon,
  ClockIcon,
  MessageSquareIcon,
  UserCheckIcon,
} from "lucide-react";
import {
  UsersIcon,
  HeartIcon,
  MessageCircleIcon,
  Trash2Icon,
  CheckCheckIcon
} from "lucide-react";

import NoNotificationsFound from "../components/NoNotificationsFound";
import ProfileAvatar from "../components/ProfileAvatar";

const NotificationsPage = () => {
  const queryClient = useQueryClient();

  const { data: friendRequests, isLoading } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendRequests,
    refetchInterval: 10000, 
  });

  const { data: notifications, isLoading: isNotificationsLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    refetchInterval: 15000,
  });

  const { mutate: markAllReadMutation } = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const { mutate: acceptRequestMutation, isPending: isAccepting } = useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });

  const { mutate: rejectRequestMutation, isPending: isRejecting } = useMutation({
    mutationFn: rejectFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
    },
  });



  const incomingRequests = friendRequests?.incomingReqs || [];
  const acceptedRequests = friendRequests?.acceptedReqs || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto space-y-10">
        {/* Nav */}
        
      </div>

      <br/>
      
      <div className="container mx-auto max-w-4xl space-y-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Notifications
          </h1>
          {notifications?.length > 0 && (
            <button 
              onClick={() => markAllReadMutation()}
              className="btn btn-ghost btn-sm gap-2"
            >
              <CheckCheckIcon size={16} />
              Mark all as read
            </button>
          )}
        </div>


        {isLoading || isNotificationsLoading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (

          <>
            {/* Friend Requests */}
            {incomingRequests.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <UserCheckIcon className="h-5 w-5 text-primary" />
                  Friend Requests
                  <span className="badge badge-primary ml-2">
                    {incomingRequests.length}
                  </span>
                </h2>

                <div className="space-y-3">
                  {incomingRequests.filter((req) => req.sender).map((request) => (
                    <div
                      key={request._id}
                      className="card bg-base-200 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="card-body p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <ProfileAvatar src={request.sender?.profilePic} name={request.sender?.fullName} size="w-14 h-14" textSize="text-xl" />
                            <div>
                              <h3 className="font-semibold">
                                {request.sender?.fullName}
                              </h3>
                              <p className="text-xs opacity-60">Sent you a friend request</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => rejectRequestMutation(request._id)}
                              disabled={isAccepting || isRejecting}
                            >
                              Remove
                            </button>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => acceptRequestMutation(request._id)}
                              disabled={isAccepting || isRejecting}
                            >
                              Accept
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* In-App Notifications (Likes/Comments) */}
            {notifications?.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <BellIcon className="h-5 w-5 text-primary" />
                  Recent Activity
                </h2>

                <div className="space-y-3">
                  {notifications.map((n) => (
                    <div
                      key={n._id}
                      className={`card bg-base-200 shadow-sm border-l-4 ${!n.isRead ? 'border-primary' : 'border-transparent'}`}
                    >
                      <div className="card-body p-4">
                        <div className="flex items-start gap-3">
                          <ProfileAvatar src={n.sender?.profilePic} name={n.sender?.fullName} size="w-12 h-12" />
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm">
                              {n.sender?.fullName}
                            </h3>
                            <p className="text-sm my-1">
                              {n.type === 'like' ? (
                                <span>liked your <Link to="/sparks" className="text-primary hover:underline font-medium">spark</Link></span>
                              ) : n.type === 'comment' ? (
                                <span>commented: "{n.content}"</span>
                              ) : (
                                "interacted with you"
                              )}
                            </p>
                            <p className="text-[10px] opacity-50 flex items-center gap-1">
                              <ClockIcon size={10} />
                              {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                          <div className={`size-8 rounded-lg flex items-center justify-center ${n.type === 'like' ? 'bg-error/10 text-error' : 'bg-info/10 text-info'}`}>
                            {n.type === 'like' ? <HeartIcon size={16} fill="currentColor" /> : <MessageCircleIcon size={16} />}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}


            {/* Accepted Friend Requests */}
            {acceptedRequests.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <BellIcon className="h-5 w-5 text-success" />
                  New Connections
                </h2>

                <div className="space-y-3">
                  {acceptedRequests.filter((n) => n.recipient).map((notification) => (
                    <div
                      key={notification._id}
                      className="card bg-base-200 shadow-sm"
                    >
                      <div className="card-body p-4">
                        <div className="flex items-start gap-3">
                          <ProfileAvatar src={notification.recipient?.profilePic} name={notification.recipient?.fullName} size="w-10 h-10" textSize="text-base" />
                          <div className="flex-1">
                            <h3 className="font-semibold">
                              {notification.recipient?.fullName}
                            </h3>
                            <p className="text-sm my-1">
                              {notification.recipient?.fullName} accepted your
                              friend request
                            </p>
                            <p className="text-xs flex items-center opacity-70">
                              <ClockIcon className="h-3 w-3 mr-1" />
                              Recently
                            </p>
                          </div>
                          <div className="badge badge-success">
                            <MessageSquareIcon className="h-3 w-3 mr-1" />
                            New Friend
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {incomingRequests.length === 0 && acceptedRequests.length === 0 && (!notifications || notifications.length === 0) && (
              <NoNotificationsFound />
            )}

          </>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
