var express = require('express'),
  app = express(),
  path = require('path'),
  request = require('request'),
  imagesearchRouter = express.Router(),
  latestRouter = express.Router(),
  mongoose = require('mongoose');


mongoose.connect('mongodb://localhost:27017/imagesearch');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // we're connected!
});

var querySchema = mongoose.Schema({
  term: String,
  when: String
});

var Query = mongoose.model('Query', querySchema);

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname + '/index.html'));
});

latestRouter.use(function (req, res, next) {
  console.log(req.method, req.url);
  next();
});

///////
//  Create page with latest queries
//////
latestRouter.get('/imagesearch', function(req, res) {

  Query.find({},null,{sort: '-when'}, function (err, records) {
    if (err) {return console.error(log)}

    //TODO: need reverse record fron new to old

    numberRecords = (records.length > 10) ? (10)  : records.length;

    var arr = [];

    for(var i = 0, j = numberRecords; i < j; i++ ) {

        var obj = {};
        obj.term = records[i].term;
        obj.when = records[i].when;
        arr.push(obj);
    }

    res.contentType('application/json');
    res.send(JSON.stringify(arr));

  });

});


imagesearchRouter.use(function (req, res, next) {
  console.log(req.method, req.url);
  next();
});

imagesearchRouter.get('/', function (req, res) {
  res.send('imagesearch base URL');
});

imagesearchRouter.get('/:imageQuery', function (req, res) {

  var url = 'https://www.googleapis.com/customsearch/v1?q='+ req.params.imageQuery +'&cx=009450657259060162830%3Az9mqnzccxpi&searchType=image&key=AIzaSyCGsdsSaRofXRsQzrMn5S1QRw0rCh9lUfU';



  // TODO: remove 3 party's module 'reques'

  request({
    url: url,
    json: true
  }, function (error, response, body) {

    if (!error && response.statusCode === 200) {
      var json = parseJSON(body);
      res.contentType('application/json');
      res.send(json);
      recordQueryToDB(req.params.imageQuery);

    }
  });

});

app.use("/imagesearch", imagesearchRouter);
app.use("/latest", latestRouter);

app.listen(3000);
console.log("Server start on http://localhost:3000");


function parseJSON (json) {
  var arr = [];

  //if(json.items === undefined) return [];

  json.items.forEach(function (elem) {
    var obj = {};
    obj.url = elem.link;
    obj.snippet = elem.title;
    obj.thumbnail = elem.image.thumbnailLink;
    obj.context = elem.image.contextLink;
    arr.push(obj);
  });

  return JSON.stringify(arr);
}


function recordQueryToDB(query) {
  record = new Query({
    term: query,
    when: (new Date().toISOString())
  });

  record.save(function (err, record) {
    if (err) return console.error(err);
    console.log('we save: ' + query);
  });
}