var og = require('./og');
og("http://europ.in/item/92085/038EEF1D90CAF9F3EC742AFCAC61F6997242BFC6?q=Rīga", function(error, result){
	if(!error){
		console.log(result);
	} else {
		console.log("Error:", error);
	}
})