
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    business: {
      companyName: { type: String, trim: true, default: "" },
      gstin: { type: String, trim: true, default: "" },
      udyamNumber: { type: String, trim: true, default: "" },
      businessType: { type: String, trim: true, default: "" },
      categories: { type: [String], default: [] },
      state: { type: String, trim: true, default: "" },
      annualTurnover: { type: Number, default: null },
      yearsOfExperience: { type: Number, default: null },    
      documents: { type: String, default: "" },

    },

    // Tenders saved by this particular user
    savedTenderIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tender",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
