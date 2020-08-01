const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
    userId: String,
    name: String,
    status: {
        type: String,
        enum: ["STARTED", "PAUSED", "RESUMED"],
        default: "STARTED",
    },
});

module.exports = mongoose.model("Subscription", subscriptionSchema);
