
const express = require("express");
const mongoose = require("mongoose");
const Tender = require("../models/Tender");
const SearchHistory = require("../models/SearchHistory");
const requireAuth = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

// Search the tender records stored in MongoDB.
// This does not call TinyFish or pretend cached data is live.
router.get("/search", async (req, res, next) => {
  try {
    const query = String(req.query.q || "").trim().slice(0, 150);
    const state = String(req.query.state || "").trim().slice(0, 80);
    const category = String(req.query.category || "").trim().slice(0, 100);
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));

    const filter = {};

    if (query) {
      filter.$text = { $search: query };
    }
    if (state) filter.state = new RegExp(`^${state.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
    if (category) {
      filter.category = new RegExp(`^${category.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
    }

    const [items, total] = await Promise.all([
      Tender.find(filter)
        .sort({ lastCheckedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Tender.countDocuments(filter),
    ]);

    await SearchHistory.create({
      user: req.userId,
      query,
      filters: { state, category, page, limit },
      resultTenderIds: items.map((item) => item._id),
      resultCount: total,
    });

    res.json({
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      sourceMode: "database",
      message: "Results are from stored records. Check each official source for current availability.",
    });
  } catch (error) {
    next(error);
  }
});

router.get("/history", async (req, res, next) => {
  try {
    const history = await SearchHistory.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({ history });
  } catch (error) {
    next(error);
  }
});

router.get("/saved", async (req, res, next) => {
  try {
    const user = await mongoose.model("User").findById(req.userId).select("savedTenderIds");
    if (!user) return res.status(404).json({ message: "User not found." });

    const items = await Tender.find({
      _id: { $in: user.savedTenderIds || [] },
    }).lean();

    res.json({ items });
  } catch (error) {
    next(error);
  }
});

router.put("/:id/save", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid tender ID." });
    }

    const tender = await Tender.findById(req.params.id);
    if (!tender) return res.status(404).json({ message: "Tender not found." });

    await mongoose.model("User").updateOne(
      { _id: req.userId },
      { $addToSet: { savedTenderIds: tender._id } }
    );

    res.json({ message: "Tender saved." });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id/save", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid tender ID." });
    }

    await mongoose.model("User").updateOne(
      { _id: req.userId },
      { $pull: { savedTenderIds: req.params.id } }
    );

    res.json({ message: "Tender removed from saved items." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
