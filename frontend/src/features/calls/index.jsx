import { useCallSignaling } from './hooks/useCallSignaling.js';
import { IncomingCallModal } from './components/IncomingCallModal.jsx';
import { OutgoingCallModal } from './components/OutgoingCallModal.jsx';
import { FriendCallScreen } from './components/FriendCallScreen.jsx';
import { GroupCallScreen } from './components/GroupCallScreen.jsx';
import { FloatingCallWindow } from './components/FloatingCallWindow.jsx';
import useCallStore from './store/callSlice.js';

export const CallOverlay = () => {
    // Initialize socket listeners for call events globally
    useCallSignaling();

    const { callState, isGroup } = useCallStore();

    return (
        <>
            <IncomingCallModal />
            <OutgoingCallModal />
            
            {callState === "connected" && (
                isGroup ? <GroupCallScreen /> : <FriendCallScreen />
            )}
            
            <FloatingCallWindow />
        </>
    );
};

export { useCallSession } from './hooks/useCallSession.js';
