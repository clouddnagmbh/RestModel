/* global axios:true */
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"at/clouddna/axiostest/libs/RestModel",
	"at/clouddna/axiostest/libs/CloudDNAModel"
], function (Controller, RestModel, CloudDNAModel) {
	"use strict";

	return Controller.extend("at.clouddna.axiostest.controller.Main", {
		_oModel: null,
		_oTestModel: null,

		onInit: function () {
			this._oModel = new RestModel({
				url: "https://webidetesting7978545-ed926da1b.dispatcher.eu2.hana.ondemand.com/api",
				sendSkipTop: false,
				xcsrfTokenHandling: false
			});

			this._oTestModel = new CloudDNAModel(
				"https://webidetesting7978545-ed926da1b.dispatcher.eu2.hana.ondemand.com/api", {
					keysForEntitySet: {
						"comments": "id"
					}
				});

			this.getView().setModel(this._oTestModel, "cloudDNAModel");

			this._oTestModel.read("/blogs", {
				sendSkipTop: false,
				//select: ["CustomerId", "Firstname"],
				//orderby: ["Firstname desc"],
				restUrlParameters: {
					param1: "param1",
					param2: "param2"
				},
				success: function (oData) {
					oCodeEditor.setValue(JSON.stringify(oData, null, "\t"));
				}.bind(this),
				error: function (oError) {

				}.bind(this)
			});
		},

		onSubmitChangesPress: function () {
			this._oTestModel.submitLocalChanges();
		},

		onRefreshEntitySetPress: function () {
			this._oTestModel.refreshEntitySet("/todos");
		},

		onRefreshEntityPress: function () {
			this._oTestModel.refreshEntity("/todos/4");
		},

		onGetPress: function (oEvent) {
			let oCodeEditor = this.getView().byId("codeeditor_response"),
				sPath = this.getView().byId("uri").getValue();

			this._oModel.read(sPath, {
				sendSkipTop: false,
				//select: ["CustomerId", "Firstname"],
				//orderby: ["Firstname desc"],
				restUrlParameters: {
					param1: "param1",
					param2: "param2"
				}
				success: function (oData) {
					oCodeEditor.setValue(JSON.stringify(oData, null, "\t"));
				}.bind(this),
				error: function (oError) {

				}.bind(this)
			});
		},

		onPostPress: function (oEvent) {
			let oBody = this.getView().byId("codeeditor_body"),
				oResponse = this.getView().byId("codeeditor_response"),
				sPath = this.getView().byId("uri").getValue();

			this._oModel.create(sPath, JSON.parse(oBody.getValue()), {
				success: function (oData) {
					oResponse.setValue(JSON.stringify(oData, null, "\t"));
				},
				error: function (oError) {
					oResponse.setValue(oError);
				}
			});
		},

		onDeletePress: function (oEvent) {
			let oResponse = this.getView().byId("codeeditor_response"),
				sPath = this.getView().byId("uri").getValue();

			this._oModel.remove(sPath, {
				success: function (oData) {
					oResponse.setValue(JSON.stringify(oData, null, "\t"));
				},
				error: function (oError) {
					oResponse.setValue(oError);
				}
			});
		},

		onPutPress: function (oEvent) {
			let oBody = this.getView().byId("codeeditor_body"),
				oResponse = this.getView().byId("codeeditor_response"),
				sPath = this.getView().byId("uri").getValue();

			this._oModel.update(sPath, JSON.parse(oBody.getValue()), {
				success: function (oData) {
					oResponse.setValue(JSON.stringify(oData, null, "\t"));
				},
				error: function (oError) {
					oResponse.setValue(oError);
				}
			});
		},

		onTokenHandlingSwitch: function (oEvent) {
			this._oModel.setXCSRFTokenHandling(oEvent.getParameter("state"));
		}
	});
});