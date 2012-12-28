var http = require('http');
var cheerio = require('cheerio');

exports = module.exports = function(url, callback){
	var result = {};
	var buffer = '';
	var error = null;
	var req = http.get(url, function(res){
		res.on('end', function(){
			if(!error && Object.keys(result).length === 0){
				error = "couldn't find meta data";
			}
			callback(error, result);
		});
		if(res.headers['content-type'].indexOf("text/html") === -1){
			res.destroy();
			error = "that's not a website";
		} else {
			res.on('data', function(data){
				buffer += data;
				if(buffer.toString().indexOf('</head>') > -1){
					res.destroy();
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
				} else if(res.connection.bytesRead > 10240){
					res.destroy();
					error = 'no meta data in first 10 kilobytes';
				}
			});
		}
	});
	req.on('error', function(error){
		callback(error.message, result);
	});
}