
const mongoose = require("mongoose");

const tenderSchema = new mongoose.Schema(
  {
    externalId: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    department: { type: String, default: "" },
    description: { type: String, default: "" },
    category: { type: String, default: "" },
    state: { type: String, default: "" },
    estimatedValue: { type: Number, default: null },
    deadline: { type: Date, default: null },
    officialUrl: { type: String, required: true },
    source: { type: String, required: true },
    sourceUpdatedAt: { type: Date, default: null },
    lastCheckedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

tenderSchema.index({ source: 1, externalId: 1 }, { unique: true });
tenderSchema.index({ title: "text", description: "text", department: "text" });

module.exports = mongoose.model("Tender", tenderSchema);
