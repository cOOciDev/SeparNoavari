import Assignment from "../models/Assignment.js";
import Idea from "../models/Idea.js";
import Judge from "../models/Judge.js";

class JudgesController {
  static async getAssignedIdeas(req, res, next) {
    try {
      const judge = await Judge.findOne({ user: req.user.id }).lean();
      if (!judge) {
        return res.status(404).json({
          ok: false,
          code: "JUDGE_PROFILE_MISSING",
          message: "Judge profile not found",
        });
      }

      const assignments = await Assignment.find({ judge: judge._id })
        .populate("idea")
        .lean();
      const ideas = assignments
        .map((assignment) => assignment.idea)
        .filter(Boolean);

      return res.json({
        ok: true,
        items: ideas,
      });
    } catch (err) {
      return next(err);
    }
  }
}

export default JudgesController;
