var dateFormat = require("dateformat");
var conf = require("../config/config.js");
var collections = [conf.destinationCollection];
var db = require("mongojs").connect(conf.mongodb, collections);
var request = require('request');

console.log(dateFormat(new Date(),"yyyymmdd h:MM:ss")+" Starting run...")
/*Get the largest id in the current collection */
db.collection(conf.destinationCollection).find({},{id_str:1}).sort({id:-1}).limit(1, function(err, maxTweet) {
	if (err)
	{
		/*If err, something is wrong with Mongo, exit*/
 		console.log(dateFormat(new Date(),"yyyymmdd h:MM:ss")+"    Database getMaxTweet error! "+err);
	}
	else {
		/*Form up request*/
		console.log(dateFormat(new Date(),"yyyymmdd h:MM:ss")+"    Forming request. Max Id: "+maxTweet[0].id_str)
		url = 'http://search.twitter.com/search.json?q='+conf.searchPhrase+'&geocode='+conf.boundingBox+','+conf.radius+'km&rpp='+conf.pagesToReturn+'&since_id='+maxTweet[0].id_str;
		/*Send request to twitter*/
		request(url, function (error, response, body) {
		  if (!error && response.statusCode == 200) {
			var tweetResponse = JSON.parse(body);
			console.log(dateFormat(new Date(),"yyyymmdd h:MM:ss")+"    Number of new tweets: "+tweetResponse.results.length)		
			tweetResponse.results.forEach(function(tweet) {
				/*Add it*/
			        console.log(dateFormat(new Date(),"yyyymmdd h:MM:ss")+"    Adding tweet: "+tweet.id_str)
				/*Add java date time to save time later*/
			        tweet.jDate = new Date(tweet.created_at);
				/*Write it to Mongo*/
			        var encodedText =
			        db.collection(conf.destinationCollection).insert(tweet,function(err) {
			                if (err) {
						/*Mongo bombs out on write*/
			                        console.log(dateFormat(new Date(),"yyyymmdd h:MM:ss")+"    Database insert error: "+err);
			                }
			        });
			});
		  }
		  else if (error) {
		    /*Request to twitter fails*/
		    console.log(dateFormat(new Date(),"yyyymmdd h:MM:ss")+"    Twitter request error: "+error);
		  }
		  else {
		    /*Twitter responds with something other that a http 200*/
		    console.log(dateFormat(new Date(),"yyyymmdd h:MM:ss")+"    Twitter bad response: "+ response.statusCode);
		  }
		});
	}
});
/*Fix this. How do we know all the work is done?*/
setTimeout(function(){
  process.exit(0);
}, 10000);




