const urlModel = require("../models/urlModel")
const redis = require("../redis/redis")
const { SETEX_ASYNC, GET_ASYNC, SET_ASYNC } = redis
const shortid = require('shortid')
let validUrl = require('valid-url');


const creatUrl = async function (req, res) {
    try {
        let { longUrl } = req.body

        if (!longUrl) {
            return res.status(400).send({ status: false, message: "longUrl is required" })
        }
        if (typeof longUrl != "string") {
            return res.status(400).send({ status: false, message: "long URL should be type of string" })
        }
        if (!validUrl.isUri(longUrl)) {
            return res.status(400).send({ status: false, message: "invalid long URL" })
        }

        let casheData = await GET_ASYNC(`${longUrl}`);
        if (casheData) {
            return res.status(200).send({ status: false, msg: " data from cache", data: JSON.parse(casheData) })
        }

        let url = await urlModel.findOne({ longUrl }).select({ longUrl: 1, shortUrl: 1, urlCode: 1, _id: 0 })
        if (url) {
            await SETEX_ASYNC(`${longUrl}`, 60, JSON.stringify({ longUrl }))        // set in cache
            return res.status(200).send({ status: true, msg: "Data from db", data: url })
        }

        const urlCode = shortid.generate().toLowerCase()
        const shortUrl = `http://localhost:3000/${urlCode}`

        let obj = { longUrl, shortUrl, urlCode }
        await urlModel.create(obj)
        //await SETEX_ASYNC(`${longUrl}`, 20, JSON.stringify(longUrl))  
        return res.status(201).send({ status: true, msg: "data newly created", data: obj })
    } catch (err) {
        return res.status(500).send({ status: false, message: err })
    }
}

const getUrl = async function (req, res) {
    try {
        const urlCode = req.params.urlCode
        if (!urlCode) {
            return res.status(400).send({ status: false, message: "please enter urlCode in params" })
        }
        if (urlCode.length != 9) {
            return res.status(400).send({ status: false, message: "url code should be 9 characters only" })
        }
        if (/.*[A-Z].*/.test(urlCode)) {
            return res.status(400).send({ status: false, message: "please Enter urlCode only in lowercase " })
        }
        if (!shortid.isValid(urlCode)) {
            return res.status(400).send({ status: false, message: "please enter valid url" })
        }
        
        let casheData = await GET_ASYNC(`${urlCode}`);
        if(casheData) {
            return res.status(302).redirect(casheData);
        }

        let findURL = await urlModel.findOne({ urlCode: urlCode }).select({ _id: 0, __v: 0 });
        if (!findURL) {
            return res.status(404).send({ status: false, msg: "url not found" })
        } else {
            await SET_ASYNC(`${urlCode}`, findURL.longUrl);
            return res.status(302).redirect(findURL.longUrl);
        }
    }
    catch (err) {
        res.status(500).send({ status: false, message: err })
    }
}


module.exports = { creatUrl, getUrl }