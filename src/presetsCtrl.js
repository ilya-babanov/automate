(function () {
	var presets,
		canvasData,
		canvasService;
	var PresetsCtrl = function ($timeout, presetsValue, canvasServiceObject) {
		this.presets = presets = presetsValue;
		canvasService = canvasServiceObject;
		canvasData = canvasService.canvasData;
		
		this.showPresets = false;
		this.currentPattern = null;
		
		canvasData.canvas.addEventListener('click', this.onCanvasClick.bind(this))
	};

	PresetsCtrl.prototype.onCanvasClick = function onCanvasClick(event) {
		if (!this.currentPattern) {
			return;
		}
		event.stopPropagation();
		var rowsIndex = Math.floor(event.layerY / canvasData.canvasRatio),
			cellsIndex = Math.floor(event.layerX / canvasData.canvasRatio),
			index = rowsIndex * canvasData.cellsCount + cellsIndex;
		console.log("index: ", index);
		console.log("this.currentPattern.array: ", this.currentPattern.array);
		this.currentPattern.array.forEach(function (value) {
			automate.statesView[index] = value;
			canvasService.updateCanvasCell(value, cellsIndex, rowsIndex);
			index++;
			cellsIndex = ++cellsIndex % canvasData.cellsCount;
			rowsIndex = ++rowsIndex % canvasData.rowsCount;
		});
	};

	PresetsCtrl.$inject = ['$timeout', 'presets', 'canvasService'];

	angular.module('app').controller('PresetsCtrl', PresetsCtrl);
})();