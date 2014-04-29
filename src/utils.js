var fnToWorker = function (fn) {
	var workerBody = 
		"var fn=" + fn.toString() + ";" +
		"self.addEventListener('message', function (event) {" +
			"self.postMessage(fn(event.data));" +
		"});";
	return new Worker(URL.createObjectURL(new Blob([workerBody])));
};