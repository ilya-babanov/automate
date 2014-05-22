(function() {
	
	function canvasData() {
		return {
			canvas: null,
			rowsCount: 20,
			cellsCount: 40,
			canvasRatio: 22,
			cellSize: 10
		}
	}
	
	angular.module('app').factory('canvasData', canvasData);
})();