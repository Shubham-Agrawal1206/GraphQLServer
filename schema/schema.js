const graphql = require("graphql");
const User = require("../models/user");
const Subscription = require("../models/subscription");
const jwt = require("jsonwebtoken");

const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLSchema,
    GraphQLID,
    GraphQLList,
    GraphQLNonNull,
} = graphql;

const UserType = new GraphQLObjectType({
    name: "User",
    fields: () => ({
        id: { type: GraphQLID },
        username: { type: GraphQLString },
        email: { type: GraphQLString },
        subscriptions: {
            type: new GraphQLList(SubscriptionType),
            resolve(parent, args) {
                return Subscription.find({ userId: parent.id });
            },
        },
    }),
});

const SubscriptionType = new GraphQLObjectType({
    name: "Subscription",
    fields: () => ({
        id: { type: GraphQLID },
        name: { type: GraphQLString },
        status: { type: GraphQLString },
        user: {
            type: UserType,
            resolve(parent, args) {
                return User.findById(parent.userId);
            },
        },
    }),
});

const RootQuery = new GraphQLObjectType({
    name: "RootQueryType",
    fields: {
        user: {
            type: UserType,
            args: { id: { type: GraphQLID } },
            resolve(parent, args) {
                return User.findById(args.id);
            },
        },
        subscription: {
            type: SubscriptionType,
            args: { id: { type: GraphQLID } },
            resolve(parent, args) {
                return Subscription.findById(args.id);
            },
        },
        users: {
            type: new GraphQLList(UserType),
            resolve(parent, args) {
                return User.find({});
            },
        },
        subscriptions: {
            type: new GraphQLList(SubscriptionType),
            resolve(parent, args) {
                return Subscription.find({});
            },
        },
        generateToken: {
            type: GraphQLID,
            args: {
                email: { type: GraphQLString },
                password: { type: GraphQLString },
            },
            resolve(parent, args) {
                User.findOne({ email: args.email }, (err, res) => {
                    if (err) return err;
                    res.comaprePassword(args.password, (err, isMatch) => {
                        if (err) return err;
                        if (!isMatch) throw new Error("Password Invalid!");
                        const accessToken = jwt.sign(
                            { username: res.username, email: res.email },
                            process.env.SECRET
                        );
                        return accessToken;
                    });
                });
            },
        },
    },
});

const Mutation = new GraphQLObjectType({
    name: "Mutation",
    fields: {
        addSubscription: {
            type: SubscriptionType,
            args: {
                name: { type: new GraphQLNonNull(GraphQLString) },
                token: { type: new GraphQLNonNull(GraphQLString) },
            },
            resolve(parent, args) {
                jwt.verify(args.token, process.env.SECRET, (err, user) => {
                    if (err) return err;
                    User.findOne({ email: user.email }, (err, res) => {
                        if (err) return err;
                        let subscription = new Subscription({
                            name: args.name,
                            userId: res._id,
                        });
                        return subscription.save();
                    });
                });
            },
        },
        pauseSubscription: {
            type: SubscriptionType,
            args: {
                id: { type: new GraphQLNonNull(GraphQLID) },
                token: { type: new GraphQLNonNull(GraphQLString) },
            },
            resolve(parent, args) {
                Subscription.findById(args.id, (err, res) => {
                    if (err) return err;
                    jwt.verify(args.token, process.env.SECRET, (err, user) => {
                        User.findOne({ email: user.email }, (err, userRes) => {
                            if (err) return err;
                            if (!userRes._id.equals(res.userId))
                                throw new Error("User not matching!");
                            res.status = "PAUSED";
                            return res.save();
                        });
                    });
                });
            },
        },
        resumeSubscription: {
            type: SubscriptionType,
            args: {
                id: { type: new GraphQLNonNull(GraphQLID) },
                token: { type: new GraphQLNonNull(GraphQLString) },
            },
            resolve(parent, args) {
                Subscription.findById(args.id, (err, res) => {
                    if (err) return err;
                    jwt.verify(args.token, process.env.SECRET, (err, user) => {
                        User.findOne({ email: user.email }, (err, userRes) => {
                            if (err) return err;
                            if (!userRes._id.equals(res.userId))
                                throw new Error("User not matching!");
                            res.status = "RESUMED";
                            return res.save();
                        });
                    });
                });
            },
        },
        deleteSubscription: {
            type: SubscriptionType,
            args: {
                id: { type: new GraphQLNonNull(GraphQLID) },
                token: { type: new GraphQLNonNull(GraphQLString) },
            },
            resolve(parent, args) {
                Subscription.findById(args.id, (err, res) => {
                    if (err) return err;
                    jwt.verify(args.token, process.env.SECRET, (err, user) => {
                        User.findOne({ email: user.email }, (err, userRes) => {
                            if (err) return err;
                            if (!userRes._id.equals(res.userId))
                                throw new Error("User not matching!");
                            return res.remove();
                        });
                    });
                });
            },
        },
        addUser: {
            type: UserType,
            args: {
                username: { type: new GraphQLNonNull(GraphQLString) },
                email: { type: new GraphQLNonNull(GraphQLString) },
                password: { type: new GraphQLNonNull(GraphQLString) },
            },
            resolve(parent, args) {
                let user = new User({
                    name: args.name,
                    email: args.email,
                    password: args.password,
                });
                return user.save();
            },
        },
    },
});

module.exports = new GraphQLSchema({
    query: RootQuery,
    mutation: Mutation,
});
