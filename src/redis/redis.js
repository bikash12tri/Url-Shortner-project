const redis = require("redis")
const {promisify} = require("util")

//Connect to redis
const redisClient = redis.createClient(
    17158,
    "redis-17158.c17.us-east-1-4.ec2.cloud.redislabs.com",
    { no_ready_check: true }
);
redisClient.auth("f5sWRo37SPYE7xcFLP4XZF3yIKX5UhJV", function (err) {
    if (err) throw err;
});

redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
});

//Connection setup for redis

const SETEX_ASYNC = promisify(redisClient.SETEX).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);
const SET_ASYNC = promisify(redisClient.SET).bind(redisClient)

module.exports = { SETEX_ASYNC, GET_ASYNC, SET_ASYNC }