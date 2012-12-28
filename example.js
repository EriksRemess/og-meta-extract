var og = require('./og');
og("http://ogp.me", function(error, result){
	if(!error){
		console.log(result);
	} else {
		console.log("Error:", error);
	}
})