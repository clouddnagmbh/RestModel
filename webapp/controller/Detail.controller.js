sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function (Controller) {
	"use strict";

	return Controller.extend("at.clouddna.axiostest.controller.Detail", {

		onInit: function () {
			sap.ui.core.UIComponent.getRouterFor(this).getRoute("Detail").attachPatternMatched(this._onPatternMatched, this);;
		},

		_onPatternMatched: function (oEvent) {
			let iKey = oEvent.getParameter("arguments").id;

			this.getView().bindElement("/todos/" + iKey);
		},

		onSavePress: function (oEvent) {

		}

	});

});