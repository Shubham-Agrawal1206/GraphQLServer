const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const SALT_GEN_FACTOR = 10;

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        index: {
            unique: true,
        },
    },
    password: {
        type: String,
        required: true,
    },
});

userSchema.pre("save", (next) => {
    let user = this;
    if (!user.isModified("password")) return next();

    bcrypt.genSalt(SALT_GEN_FACTOR, (err, salt) => {
        if (err) return next(err);
        bcrypt.hash(user.password, salt, (err, hash) => {
            if (err) return next(err);
            user.password = hash;
            next();
        });
    });
});

userSchema.method.comparePassword = (candidatePassword, cb) => {
    bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};

module.exports = mongoose.model("User", userSchema);
