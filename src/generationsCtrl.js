/* global generations, angular */
(function () {

var canvasData,
	canvasService;
var GenerationsCtrl = function ($timeout, canvasServiceObject) {
	canvasService = canvasServiceObject;
	canvasData = canvasService.canvasData;
	
	this.showActors = true;
	this.currentIndex = 0;
	this.actors = generations.typeData;
	
	//canvasData.canvas.addEventListener('click', this.onCanvasClick.bind(this));
};

GenerationsCtrl.prototype.onCanvasClick = function onCanvasClick(event) {
	event.stopPropagation();
	var rowsIndex = Math.floor(event.layerY / canvasData.canvasRatio),
		cellsIndex = Math.floor(event.layerX / canvasData.canvasRatio),
		index = rowsIndex * canvasData.cellsCount + cellsIndex;

	canvasService.automate.statesView[index] = canvasService.automate.statesView[index] === 1 ? 0 : 1;
	canvasService.updateCanvasCell(canvasService.automate.statesView[index], cellsIndex, rowsIndex);
};

GenerationsCtrl.prototype.stringToArray = function (data, name) {
	data[name] = data[name+'String'].split(' ').map(Number);
};

GenerationsCtrl.$inject = ['$timeout', 'canvasService'];

angular.module('app').controller('GenerationsCtrl', GenerationsCtrl);

}());
