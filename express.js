const knex = require('./knexConfig')
const passport = require('passport');
const LocalStrategy = require('passport-local');
const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const fs = require("fs");
const port = 3310;
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

var options = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '12345678',
    database: 'test'
};
var sessionStore = new MySQLStore(options);

app.use(session({
    secret: 'its a expressPassport auth' ,
    resave: false,
    saveUninitialized: true,
    store: sessionStore,
}));

app.use(passport.initialize())
app.use(passport.session())
app.use(bodyParser.urlencoded({ extended: true }))

passport.serializeUser(function (user, cb) {
    cb(null, user);
});
  
passport.deserializeUser(async function (id, cb) {
    var user = await knex('admin_acc').select('*').where('id', id).limit(1)
    cb(null, user[0])
});

passport.use(new LocalStrategy(

    function (username, password, done) {
        console.log(username + ' ; ' + password)

        knex('admin_acc').select('*')
        .where('username', username)
        .andWhere('password', password)
        .then((resultArray) => {
        if(resultArray.length < 1) {
            return done(null, user, {'message': '帳號或密碼輸入錯誤'});
        } else {
            var user = { username: username, userId: resultArray[0].user_id};
            return done(null, user, {'message': '登入成功'});
        }
        }).catch((error) => {
        return done(null, false, {'message': error});
        })
    }
));

app.get('/is_auth', function (req, res) {
    //res.sendFile( __dirname + "/" + "index.html" );
    if(req.session.passport && req.session.passport.user){
        res.send('true 用戶' + req.user.username + '已登入');
      }else{
        res.send('false 未登入');
    }
})

app.post('/login', function(req, res, next){
    console.log(req.session)
    passport.authenticate('local', function(err, user, info) {
      if (err) { return next(err) }
      if (!user) { return res.json( { message: info.message }) }
  
      req.logIn(user, function(err) {
        if (err) return next(err);
        return res.send('登入成功 ' + JSON.stringify(user));
      })
    })(req, res, next);
});

app.post('/logout', function(req, res, next) {
    req.logout(function(err) {
      if (err) { return next(err); }
      req.session.destroy()
      res.redirect('/');
    });
});
  
app.get('/hello', function (req, res) {
      res.send("Hello World");
})
  
let num = [3, 1, 12, 99, 32, 7];
  app.post('/sortnum', function (req, res) {
      res.send("Sort array : " + num.sort(function(a,b){return a-b}));
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
