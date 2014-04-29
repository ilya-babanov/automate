var fnToWorker = function (fn) {
	var workerBody = "self.addEventListener('message', function (event) {" +
			"var result;" +
			"try {" +
				"result = (" + fn.toString() + ")(event.data);" +
				"self.postMessage(result);" +
			"} catch (error) {" +
				"self.postMessage(error);" +
			"}" +
		"});";
	return new Worker(URL.createObjectURL(new Blob([workerBody])));
};