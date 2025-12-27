import mongoose from "mongoose";

const momentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      default: "",
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isHidden: {
      type: Boolean,
      default: false,
    },
    hiddenReason: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);


const Moment = mongoose.model("Moment", momentSchema);
export default Moment;
