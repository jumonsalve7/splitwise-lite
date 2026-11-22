import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getGroups,
  createGroup,
  getGroupById,
  addExpense,
  updateMembers,
  updateGroup,
  deleteGroup,
} from "../controllers/groupController.js";

const router = Router();

router.use(protect);

router.get("/", getGroups);
router.post("/", createGroup);
router.get("/:id", getGroupById);
router.patch('/:id', updateGroup);
router.delete('/:id', deleteGroup);
router.post("/:id/expenses", addExpense);
router.patch("/:id/members", updateMembers);

export default router;
