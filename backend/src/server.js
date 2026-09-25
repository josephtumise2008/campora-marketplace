require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5050;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Campora backend running on http://localhost:${PORT}`);
  });
};

startServer();
