import { useState, useEffect, useCallback } from "react";
import { BarChart3, Check, ChevronDown, ChevronUp, Users } from "lucide-react";
import { getPoll, votePoll } from "../lib/api";
import useAuthUser from "../hooks/useAuthUser";

const PollBubble = ({ pollId, isOwn, senderName, isGroupChat, socket }) => {
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [showVoters, setShowVoters] = useState(false);
  const { authUser } = useAuthUser();

  const userId = authUser?._id;

  // Fetch poll data
  const fetchPoll = useCallback(async () => {
    try {
      const data = await getPoll(pollId);
      setPoll(data);
    } catch (err) {
      console.error("Failed to fetch poll:", err);
    } finally {
      setLoading(false);
    }
  }, [pollId]);

  useEffect(() => {
    fetchPoll();
  }, [fetchPoll]);

  // Listen for real-time vote updates
  useEffect(() => {
    if (!socket) return;

    const handleVoteUpdate = (data) => {
      if (data.pollId === pollId) {
        setPoll(data.poll);
      }
    };

    socket.on("poll-vote-update", handleVoteUpdate);
    return () => socket.off("poll-vote-update", handleVoteUpdate);
  }, [socket, pollId]);

  const handleVote = async (optionIndex) => {
    if (!poll || voting) return;

    // Check if already voted for this option
    const option = poll.options[optionIndex];
    const alreadyVoted = option.votes.some(
      (v) => v.userId === userId || v.userId?._id === userId
    );

    if (alreadyVoted) return;

    // If not multiple choice, check if voted for any option
    if (!poll.multipleChoice) {
      const hasVotedAny = poll.options.some((opt) =>
        opt.votes.some((v) => v.userId === userId || v.userId?._id === userId)
      );
      if (hasVotedAny) return;
    }

    setVoting(true);
    try {
      const data = await votePoll(pollId, optionIndex);
      setPoll(data.poll);
    } catch (err) {
      console.error("Vote failed:", err);
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return (
      <div className={`poll-bubble ${isOwn ? "poll-bubble-own" : "poll-bubble-other"}`}>
        <div className="poll-loading">
          <div className="poll-loading-spinner" />
          <span>Loading poll...</span>
        </div>
      </div>
    );
  }

  if (!poll) return null;

  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes.length, 0);

  const hasVotedAny = poll.options.some((opt) =>
    opt.votes.some((v) => v.userId === userId || v.userId?._id === userId)
  );

  return (
    <div className={`poll-bubble ${isOwn ? "poll-bubble-own" : "poll-bubble-other"}`}>
      {isGroupChat && !isOwn && senderName && (
        <div className="poll-sender-name">{senderName}</div>
      )}

      {/* Poll Header */}
      <div className="poll-header">
        <BarChart3 size={18} className="poll-header-icon" />
        <span className="poll-header-label">Poll</span>
      </div>

      {/* Question */}
      <h4 className="poll-question">{poll.question}</h4>

      {/* Options */}
      <div className="poll-options">
        {poll.options.map((option, idx) => {
          const voteCount = option.votes.length;
          const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          const isSelected = option.votes.some(
            (v) => v.userId === userId || v.userId?._id === userId
          );
          const canVote = !isSelected && (poll.multipleChoice || !hasVotedAny);

          return (
            <button
              key={idx}
              className={`poll-option-bar ${isSelected ? "poll-option-selected" : ""} ${
                canVote ? "poll-option-clickable" : "poll-option-disabled"
              }`}
              onClick={() => canVote && handleVote(idx)}
              disabled={!canVote || voting}
            >
              <div
                className="poll-option-fill"
                style={{ width: `${percentage}%` }}
              />
              <div className="poll-option-content">
                <span className="poll-option-text">{option.text}</span>
                <div className="poll-option-meta">
                  {isSelected && <Check size={14} className="poll-check-icon" />}
                  <span className="poll-option-pct">{percentage}%</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="poll-footer">
        <span className="poll-total-votes">
          {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
        </span>

        {poll.showVoters && totalVotes > 0 && (
          <button
            className="poll-show-voters-btn"
            onClick={() => setShowVoters(!showVoters)}
          >
            <Users size={14} />
            {showVoters ? "Hide" : "Show"} voters
            {showVoters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>

      {/* Voters list */}
      {showVoters && poll.showVoters && (
        <div className="poll-voters-list">
          {poll.options.map(
            (option, idx) =>
              option.votes.length > 0 && (
                <div key={idx} className="poll-voters-group">
                  <span className="poll-voters-option-label">{option.text}:</span>
                  <span className="poll-voters-names">
                    {option.votes
                      .map((v) =>
                        v.userId?.fullName || v.userId?.toString().slice(-6)
                      )
                      .join(", ")}
                  </span>
                </div>
              )
          )}
        </div>
      )}

      {poll.multipleChoice && (
        <div className="poll-multi-badge">Multiple choice</div>
      )}
    </div>
  );
};

export default PollBubble;
