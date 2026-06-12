import "dotenv/config";
import app from "./app";
import redisClient from "../database/redis";
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  redisClient.set("foo", "bar");
});
