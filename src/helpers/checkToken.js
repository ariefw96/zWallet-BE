const jsonwebtoken = require('jsonwebtoken')
const db = require('../config/mySQL')


module.exports = {
    isRegistered: (req, res, next) => {
        const { email } = req.body
        const checkAvailable = new Promise((resolve, reject) => {
            const queryStr = `SELECT email FROM tb_user WHERE email = ?`
            db.query(queryStr, email, (err, data) => {
                if (!err) {
                    if (!data[0]) {
                        resolve({
                            msg: `success`
                        })
                    } else {
                        reject({
                            msg: `Email telah digunakan!`
                        })
                    }
                } else {
                    reject({
                        msg: `SQLquery ERROR!`,
                        details: err
                    })
                }
            })
        }).then((result) => {
            next()
        }).catch((error) => {
            res.status(500).json(error)
        })
    },
    isLogin: (req, res, next) => {
        const bearerToken = req.header("x-access-token");
        if (!bearerToken) {
            res.json({
                msg: `Please login first`,
                status: 401
            })
        } else {
            const token = bearerToken.split(" ")[1]
            const checkBlacklist = new Promise((resolve, reject) => {
                const queryStr = `SELECT token FROM tb_login_token WHERE token = ?`
                db.query(queryStr, token, (err, data) => {
                    if (!err) {
                        if (data.length > 0) {
                            resolve(token)
                        } else {
                            reject({
                                status: 500,
                                message: `Token doesn't exist`
                            })
                        }
                    } else {
                        reject({
                            status: 500,
                            msg: err
                        })
                    }
                })
            }).then((result) => {
                try {
                    decodedToken = jsonwebtoken.verify(result, process.env.SECRET_KEY)
                    req.decodedToken = decodedToken
                    console.log(req.decodedToken)
                    next()
                } catch (err) {
                    res.status(401).json({
                        status: 401,
                        message: `Token expired or Wrong secret KEY`
                    })
                }
            }).catch((error) => {
                res.status(error.status).json(error)
            })
        }
    },
    isPIN: (req, res, next) => {
        const email = req.decodedToken.email
        const PIN = req.header("PIN")
        if (!PIN) {
            res.status(401).json({
                status: 401,
                message: `invalid PIN`
            })
        } else {
            const checkPIN = new Promise((resolve, reject) => {
                const queryStr = `SELECT * FROM tb_user WHERE email = ? AND pin = ?`
                db.query(queryStr, [email, PIN], (err, data) => {
                    if (!err) {
                        if (data.length > 0) {
                            resolve({
                                status: 200
                            })
                        } else {
                            reject({
                                status: 404,
                                message: `Token tidak teridentifikasi`
                            })
                        }
                    } else {
                        reject({
                            status: 500,
                            message: err
                        })
                    }
                })
            }).then((result) => {
                next()
            }).catch((error) => {
                res.status(error.status).json(error)
            })
        }
    }
}
