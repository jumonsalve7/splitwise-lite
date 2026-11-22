import mongoose from "mongoose";

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!uri) {
    console.error(
      "❌ Error conectando a MongoDB: falta MONGODB_URI en las variables de entorno.",
    );
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log("✅ Conectado a MongoDB");
  } catch (error) {
    console.error("❌ Error conectando a MongoDB:", error.message);
    process.exit(1);
  }
};
