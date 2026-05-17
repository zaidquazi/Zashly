import mongoose from "mongoose";

const sparkCommentSchema = new mongoose.Schema(
  {
    spark: { type: mongoose.Schema.Types.ObjectId, ref: "Spark", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    parentComment: { type: mongoose.Schema.Types.ObjectId, ref: "SparkComment", default: null },
  },
  { timestamps: true }
);


const SparkComment = mongoose.model("SparkComment", sparkCommentSchema);
export default SparkComment;
