sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function (Controller) {
	"use strict";

	return Controller.extend("at.clouddna.axiostest.controller.Master", {

		onInit: function () {

		},

		onTodoPress: function (oEvent) {
			let iKey = oEvent.getSource().getBindingContext().getObject().id;

			sap.ui.core.UIComponent.getRouterFor(this).navTo("Detail", {
				id: iKey
			}, false);
		}
	});
});