import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0.01 },
    paidBy: { type: String, required: true },
    splitBetween: [{ type: String, required: true }],
    date: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    currency: { type: String, default: "USD" },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [{ type: String, required: true, trim: true }],
    expenses: [expenseSchema],
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model("Group", groupSchema);
