const express = require("express");
const redis = require("redis");

const app = express();
const port = process.env.PORT || 3049;

app.use(express.json());

// Create Redis client and connect
const client = redis.createClient();
client.connect().catch(console.error);

// Purchase ticket endpoint
app.post("/buy", async (req, res) => {
  try {
    // Atomically pop a ticket from the 'tickets' list
    const ticket = await client.lPop("tickets");
    if (ticket) {
      res.json({
        success: true,
        ticket,
        message: "Ticket purchased successfully!",
      });
    } else {
      res.status(404).json({ success: false, message: "No tickets available" });
    }
  } catch (error) {
    console.error("Error during ticket purchase:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
