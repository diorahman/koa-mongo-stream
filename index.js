var fs = require ("fs");
var koa = require ("koa");
var mongoose = require ("mongoose");
var Readable = require ("stream").Readable;
var router = require ("koa-router");
var sse = require ("sse-stream");

// make sure we have capped collection for notifications
// db.createCollection("notifications", { capped : true, size : 5242880, max : 5000 } 
var Notification = mongoose.model("Notification", {});
mongoose.connect("localhost/test");

var app = koa();
app.use(router(app));

app.get ("/", function * (){
  this.type = "text/html";
  this.body = fs.createReadStream(__dirname + "/index.html");
});

app.get ("/subscribe", function * (){
  function notificationStream(){
    var notifications = Notification.findOne({}).tailable().stream(); // `findOne` if we just want to use it as a trigger 
    var stream = new Readable({ objectMode: true }).wrap(notifications);
    return stream;
  }
  var notif = notificationStream();
  this.set("Content-Type", "text/event-stream");
  this.set("Cache-Control", "no-cache");
  this.set("Connection", "keep-alive");
  this.body = notif.pipe(sse({ retry : 5000, id : function(){ return 1; }}));
});

app.listen (3001);


