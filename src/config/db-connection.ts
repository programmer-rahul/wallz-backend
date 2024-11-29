import mongoose from "mongoose";

const DBConnect = async () => {
  try {
    console.log("connecting to database!!!!");
    const connection = await mongoose.connect(
      process.env.MONGODB_URL as string
    );
    if (connection.connection.host) {
      console.log("DB connected!");
    }
  } catch (error) {
    console.log("Error while connecting to database", error);
    process.exit(1);
  }
};

export default DBConnect;
