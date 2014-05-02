var fnToWorker = function (fn, transferList) {
	var workerBody = 
		'var fn=' + fn.toString() + ';' +
		'self.addEventListener("message", function (event) {' +
			'var result = fn(event.data);' +
			'self.postMessage(result' + (transferList ? ', [' + transferList.toString() + ']' : '') + ');' +
		'});';
	return new Worker(URL.createObjectURL(new Blob([workerBody])));
};