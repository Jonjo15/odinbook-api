var createError = require('http-errors');
var express = require('express');
var path = require('path');
var logger = require('morgan');
require("dotenv").config()
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const authRouter = require("./routes/auth")
const cors = require("cors")
const requestRouter = require("./routes/requests")
const notificationRouter = require("./routes/notifications")
const passport = require("passport")
var app = express();

var mongoose = require('mongoose');
var mongoDB = process.env.DB_ALTERNATE || process.env.DB_HOST;
mongoose.connect(mongoDB, { useNewUrlParser: true, useCreateIndex: true, useFindAndModify: false, useUnifiedTopology: true });
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));


require('./config/passport')(passport);
app.use(passport.initialize())



app.use(logger('dev'));
app.use(express.json({limit: "50mb"}));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors())
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use("/requests", requestRouter)
app.use("/notifications", notificationRouter)
app.use("/auth", authRouter)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send('error');
});

module.exports = app;
