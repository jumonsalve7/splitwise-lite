import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Group from "../models/Group.js";

export async function ensureDemoAccountAndData() {
  const demoEmail = "demo@splitapp.dev";
  let demoUser = await User.findOne({ email: demoEmail });

  if (!demoUser) {
    const hashedPassword = await bcrypt.hash("Demo12345!", 10);
    demoUser = await User.create({
      name: "Demo User",
      email: demoEmail,
      password: hashedPassword,
      isDemo: true,
    });
  }

  await Group.deleteMany({ owner: demoUser._id });

  return {
    demoUser,
    demoGroup: null,
  };
}
