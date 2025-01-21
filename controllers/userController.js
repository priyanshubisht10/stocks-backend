//userController.js
const db = require('../services/db')
const catchasync = require('../utils/catchasync')
const User = db.User

exports.createUser = catchasync(async(req ,res,next)=>{
    const { username , email ,password} = req.body
    const newUser = await User.create({
        username,
        email,
        password
    })

    res.status(201).json({
        status : 'success',
        data : newUser
    })
})

exports.getUsers = catchasync(async(req,res,next)=>{
    const users =await  User.findAll();
    res.status(200).json({
        data : users
    })
}) 