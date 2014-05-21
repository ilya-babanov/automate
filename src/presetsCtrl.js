(function () {
	var presets;
	var PresetsCtrl = function ($timeout, presetsValue) {
		this.presets = presets = presetsValue;
		this.showPresets = false;
	};

	PresetsCtrl.prototype.startLogic = function startLogic() {
		
	};

	PresetsCtrl.$inject = ['$timeout', 'presets'];

	angular.module('app').controller('PresetsCtrl', PresetsCtrl);
})();