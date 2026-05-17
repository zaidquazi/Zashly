import { generateStreamToken } from "../lib/stream.js";
import Poll from "../models/Poll.js";
import { getIO } from "../lib/socket.js";

export async function getStreamToken(req, res) {
  try {
    const token = generateStreamToken(req.user.id);
    if (token == null) {
      return res.status(503).json({ message: "Chat service unavailable" });
    }
    res.status(200).json({ token });
  } catch (error) {
    console.error("Error in getStreamToken controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function createPoll(req, res) {
  try {
    const { question, options, multipleChoice, showVoters, channelId } = req.body;

    if (!question || !options || options.length < 2 || options.length > 10) {
      return res
        .status(400)
        .json({ message: "A poll needs a question and 2-10 options." });
    }
    if (!channelId) {
      return res.status(400).json({ message: "channelId is required." });
    }

    const poll = await Poll.create({
      question: question.trim(),
      options: options.map((text) => ({ text: text.trim(), votes: [] })),
      multipleChoice: !!multipleChoice,
      showVoters: !!showVoters,
      createdBy: req.user._id,
      channelId,
    });

    res.status(201).json(poll);
  } catch (error) {
    console.error("Error in createPoll:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function votePoll(req, res) {
  try {
    const { pollId } = req.params;
    const { optionIndex } = req.body;
    const userId = req.user._id;

    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({ message: "Poll not found." });
    }

    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      return res.status(400).json({ message: "Invalid option index." });
    }

    const alreadyVotedThisOption = poll.options[optionIndex].votes.some(
      (v) => v.userId.toString() === userId.toString()
    );
    if (alreadyVotedThisOption) {
      return res
        .status(400)
        .json({ message: "You already voted for this option." });
    }

    if (!poll.multipleChoice) {
      const hasVotedAny = poll.options.some((opt) =>
        opt.votes.some((v) => v.userId.toString() === userId.toString())
      );
      if (hasVotedAny) {
        return res
          .status(400)
          .json({ message: "You have already voted. This poll is single-choice." });
      }
    }

    poll.options[optionIndex].votes.push({ userId, votedAt: new Date() });
    await poll.save();

    let populatedPoll = poll.toObject();
    if (poll.showVoters) {
      populatedPoll = await Poll.findById(pollId)
        .populate("options.votes.userId", "fullName profilePic")
        .lean();
    }

    try {
      const io = getIO();
      io.emit("poll-vote-update", {
        pollId,
        poll: populatedPoll,
      });
    } catch (socketErr) {}

    res.status(200).json({ poll: populatedPoll });
  } catch (error) {
    console.error("Error in votePoll:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getPoll(req, res) {
  try {
    const { pollId } = req.params;

    let poll = await Poll.findById(pollId).lean();
    if (!poll) {
      return res.status(404).json({ message: "Poll not found." });
    }

    if (poll.showVoters) {
      poll = await Poll.findById(pollId)
        .populate("options.votes.userId", "fullName profilePic")
        .lean();
    }

    res.status(200).json(poll);
  } catch (error) {
    console.error("Error in getPoll:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
