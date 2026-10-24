
const express = require("express");
const User = require("../models/User");
const requireAuth = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    business: user.business,
  };
}

router.get("/", async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.patch("/", async (req, res, next) => {
  try {
    const allowed = [
      "name",
      "companyName",
      "gstin",
      "udyamNumber",
      "businessType",
      "categories",
      "state",
      "annualTurnover",
      "yearsOfExperience",
    ];

    const updates = req.body || {};
    const invalid = Object.keys(updates).filter((key) => !allowed.includes(key));

    if (invalid.length) {
      return res.status(400).json({
        message: `Unsupported fields: ${invalid.join(", ")}`,
      });
    }

    if (updates.name !== undefined) {
      if (typeof updates.name !== "string" || !updates.name.trim()) {
        return res.status(400).json({ message: "Name cannot be empty." });
      }
    }

    if (
      updates.categories !== undefined &&
      (!Array.isArray(updates.categories) ||
        !updates.categories.every((item) => typeof item === "string"))
    ) {
      return res.status(400).json({ message: "Categories must be a list of strings." });
    }

    const numericFields = ["annualTurnover", "yearsOfExperience"];
    for (const key of numericFields) {
      if (
        updates[key] !== undefined &&
        updates[key] !== null &&
        (!Number.isFinite(Number(updates[key])) || Number(updates[key]) < 0)
      ) {
        return res.status(400).json({ message: `${key} must be a non-negative number.` });
      }
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    if (updates.name !== undefined) user.name = updates.name.trim();

    for (const key of allowed.filter((key) => key !== "name")) {
      if (updates[key] !== undefined) user.business[key] = updates[key];
    }

    await user.save();
    res.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
