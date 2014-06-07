/* global life, angular */
(function () {
	var canvasData,
		canvasService;
	var PresetsCtrl = function ($timeout, presetsValue, canvasServiceObject) {
		this.presets = presetsValue;
		canvasService = canvasServiceObject;
		canvasData = canvasService.canvasData;
		
		this.showPresets = true;
		this.currentIndex = 0;
		
		canvasData.canvas.addEventListener('click', this.onCanvasClick.bind(this));
	};

	PresetsCtrl.prototype.onCanvasClick = function onCanvasClick(event) {
		var currentPattern = this.presets[this.currentIndex];
		if (!currentPattern) {
			return;
		}

		event.stopPropagation();
		var rowsIndex = Math.floor(event.layerY / canvasData.canvasRatio),
			cellsIndex = Math.floor(event.layerX / canvasData.canvasRatio),
			patternCells = currentPattern.cells,
			patternIndex = 0,
			index = rowsIndex * canvasData.cellsCount + cellsIndex;

		currentPattern.array.forEach(function (value) {
			life.statesView[index] = value;
			canvasService.updateCanvasCell(value, cellsIndex, rowsIndex);
			index++;
			patternIndex++;
			if (patternIndex > patternCells-1) {
				patternIndex = 0;
				index += canvasData.cellsCount - patternCells;
				rowsIndex++;
			}
			cellsIndex = index % canvasData.cellsCount;
		});
	};

	PresetsCtrl.$inject = ['$timeout', 'presets', 'canvasService'];

	angular.module('app').controller('PresetsCtrl', PresetsCtrl);
}());
