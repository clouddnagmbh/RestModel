sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"at/clouddna/axiostest/model/models"
], function (UIComponent, Device, models) {
	"use strict";

	return UIComponent.extend("at.clouddna.axiostest.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function () {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// enable routing
			this.getRouter().initialize();

			// set the device model
			this.setModel(models.createDeviceModel(), "device");

			/*sap.ui.require(["https://cdn.jsdelivr.net/npm/axios/dist/axios.min"], function (axios) {

			});*/
		}
	});
});