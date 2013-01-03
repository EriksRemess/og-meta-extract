var cheerio = require('cheerio');
var real_url = "";
var getdata = function(url, callback){
	real_url = url;
	var result = {};
	var buffer = '';
	var error = null;
	if(url.indexOf("https:") === 0){
		var client = require('https');
	} else if(url.indexOf("http:") === 0){
		var client = require('http');
	} else {
		error = "that's not a website";
		return callback(error, result);
	}
	var url_parts = require('url').parse(url);
	var req = client.get({
		hostname: url_parts.hostname,
		path: url_parts.path,
		method: "GET",
		headers: {
			"user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/536.26.17 (KHTML, like Gecko) Version/6.0.2 Safari/536.26.17"
		}
	}, function(res){
		var redirect = false;
		res.on('end', function(){
			if(!redirect){
				if(!error && Object.keys(result).length === 0){
					error = "couldn't find meta data";
				}
				return callback(error, result);
			}
		});
		if(res.statusCode >= 301 && res.statusCode <= 307){
			redirect = true;
			req.abort();
			return getdata(res.headers.location, callback);
		}
		res.on('data', function(data){
			if(res.headers['content-type'].indexOf("text/html") === -1){
				req.abort();
				error = "that's not a website";
			}
			buffer += data;
			if(buffer.toString().indexOf('</head>') > -1){
				req.abort();
				var $ = cheerio.load(buffer);
				var meta = $('meta');
				var keys = Object.keys(meta);
				keys.forEach(function(key){
					if(meta[key].attribs && meta[key].attribs.property && meta[key].attribs.property.indexOf('og') == 0){
						var og = meta[key].attribs.property.split(':');
						if(og.length > 2){
							if(result[og[1]]){
								if(typeof result[og[1]] == 'string' || result[og[1]] instanceof String){
									var set = {};
									set['name'] = result[og[1]];
									set[og[2]] = meta[key].attribs.content;
									result[og[1]] = set;
								} else {
									ex_set = result[og[1]];
									ex_set[og[2]] = meta[key].attribs.content;
									result[og[1]] = ex_set;
								}
							} else {
								var set = {};
								set[og[2]] = meta[key].attribs.content;
								result[og[1]] = set;
							}
						} else {
							result[og[1]] = meta[key].attribs.content;
						}
					}
				});
				if(typeof result['title'] === "undefined"){
					var title = $('title');
					if(title.length > 0){
						result['title'] = $('title')[0].children[0].data.replace(/^\s+|\s+$/g, "");
					}
				}
				if(typeof result['url'] === "undefined"){
					result['url'] = real_url;
				}
			} else if(res.connection.bytesRead >= 20480){
				req.abort();
				error = 'no meta data in first 20 kilobytes';
			}
		});
	}).on('error', function(error){
		return callback(error.message, result);
	});
}

exports = module.exports = function(url, callback){
	getdata(url, callback);
}