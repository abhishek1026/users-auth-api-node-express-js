
const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../model/users');
const router = express.Router();

// middleware to test if authenticated
function isAuthenticated (req, res, next) {
    if (req.session && req.session.user) {
        next();
    }
    else {
        res.status(401).send("Not Authorized!");
    }
  }

//POST /login
router.post('/login', async function(req, res) {
    const username = req.body.username;
    const password = req.body.password;
    if(!username || !password) {
        return res.status(400).send("Invalid Request!");
    }
    const user = await User.findOne({username});
    if(!user) {
        return res.status(401).send("Invalid Username!");
    }
    var match = false;
    try {
        match = await bcrypt.compare(password, user.password);
    }
    catch (error) {
        return res.status(500).json({error: error.message});
    }
    if(!match) {
        return res.status(401).send("Invalid Password!");
    }
    req.session.user = username;
    return res.status(200).json(user);
});

//GET /getUsers
router.get('/getUsers', isAuthenticated, async (req, res) => {
    try{
        const data = await User.find();
        res.status(200).json(data);
    }
    catch(error){
        res.status(500).json({message: error.message});
    }
});

//POST /create
router.post('/create', async (req, res) => {

    if(!req.body.username || !req.body.password) {
        return res.status(400).send("Invalid Request!");
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(req.body.password, salt);
        const user = new User({
            username: req.body.username,
            password: hash
        });
        const result = await user.save();
        res.status(201).json(result);
    }
    catch (error) {
        res.status(500).json({message: error.message});
    }
});

//POST /logout
router.post('/logout', isAuthenticated, async function(req, res) {
    var failed = false;
    var error = undefined;
    const user = req.session.user;
    req.session.destroy(function(err) {
        if(err) {
            failed = true;
            error = err;
        }
    });
    if(failed) {
        return res.status(500).json(error);
    }
    return res.status(200).send(`${user} logged out!`);
});

//PUT /resetPass
router.put('/resetPass', async function(req, res) {
    const newPass = req.body.newPass;
    if(!newPass) {
        return res.status(400).send("Invalid New Password!");
    }
    if (req.session && req.session.user) {
        const username = req.session.user;
        try {
            const user = await User.findOne({username});
            if(!user) {
                return res.status(400).send(`Logged-in user (${username}) no longer exists in DB!`);
            }
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(newPass, salt);
            user.password = hash;
            const result = await user.save();
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(500).json({message: error.message});
        }
    }
    const username = req.body.username;
    const password = req.body.password;
    if(!username || !password) {
        return res.status(400).send("Invalid Request!");
    }
    try {
        const user = await User.findOne({username});
        if(!user) {
            return res.status(401).send("Invalid Username!");
        }
        if(!bcrypt.compare(password, user.password)) {
            return res.status(401).send("Invalid Password!");
        }
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPass, salt);
        user.password = hash;
        const result = await user.save();
        return res.status(200).json(result);
    }
    catch (error) {
        return res.status(500).json({message: error.message});
    }
    
});

module.exports = router;