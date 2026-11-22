import Group from "../models/Group.js";
import { calculateGroupBalances } from "../utils/balanceCalculator.js";

export const getGroups = async (req, res) => {
  try {
    const groups = await Group.find({ owner: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(groups);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch groups", error: error.message });
  }
};

export const createGroup = async (req, res) => {
  try {
    const { name, currency = "USD", members = [] } = req.body;
    const cleanMembers = [
      ...new Set(members.map((m) => String(m).trim()).filter(Boolean)),
    ];

    if (!name || cleanMembers.length < 2) {
      return res.status(400).json({
        message: "Group name and at least two members are required",
      });
    }

    const group = await Group.create({
      name: name.trim(),
      currency,
      owner: req.user._id,
      members: cleanMembers,
      expenses: [],
    });

    res.status(201).json(group);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to create group", error: error.message });
  }
};

export const getGroupById = async (req, res) => {
  try {
    const group = await Group.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const summary = calculateGroupBalances(group.members, group.expenses);
    res.json({
      group,
      balances: summary.balances,
      settlements: summary.settlements,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to load group details", error: error.message });
  }
};

export const addExpense = async (req, res) => {
  try {
    const { title, amount, paidBy, splitBetween } = req.body;
    const group = await Group.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const numericAmount = Number(amount);
    const participants =
      Array.isArray(splitBetween) && splitBetween.length > 0
        ? splitBetween
        : group.members;

    if (!title || !numericAmount || numericAmount <= 0 || !paidBy) {
      return res.status(400).json({
        message: "Title, positive amount, and payer are required",
      });
    }

    group.expenses.push({
      title: title.trim(),
      amount: numericAmount,
      paidBy: paidBy.trim(),
      splitBetween: participants,
    });

    await group.save();

    const summary = calculateGroupBalances(group.members, group.expenses);
    res.status(201).json({
      group,
      balances: summary.balances,
      settlements: summary.settlements,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to add expense", error: error.message });
  }
};

export const updateMembers = async (req, res) => {
  try {
    const { members } = req.body;
    const group = await Group.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const cleanMembers = [
      ...new Set(
        (Array.isArray(members) ? members : [])
          .map((m) => String(m).trim())
          .filter(Boolean),
      ),
    ];

    if (cleanMembers.length < 2) {
      return res
        .status(400)
        .json({ message: "Group must have at least 2 members" });
    }

    group.members = cleanMembers;
    await group.save();

    const summary = calculateGroupBalances(group.members, group.expenses);
    res.json({
      group,
      balances: summary.balances,
      settlements: summary.settlements,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update members", error: error.message });
  }
};

export const updateGroup = async (req, res) => {
  try {
    const { name } = req.body;
    const cleanName = String(name || "").trim();

    if (!cleanName) {
      return res.status(400).json({ message: "Group name is required" });
    }

    const group = await Group.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    group.name = cleanName;
    await group.save();

    const summary = calculateGroupBalances(group.members, group.expenses);
    res.json({
      group,
      balances: summary.balances,
      settlements: summary.settlements,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update group", error: error.message });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const deleted = await Group.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!deleted) {
      return res.status(404).json({ message: "Group not found" });
    }

    res.json({ message: "Group deleted", deletedId: deleted._id });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete group", error: error.message });
  }
};
