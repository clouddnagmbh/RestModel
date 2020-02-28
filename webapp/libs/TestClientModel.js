/* global axios:true */
sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"at/clouddna/axiostest/libs/axios",
	"at/clouddna/axiostest/libs/MetadataObjectFormatter",
	"at/clouddna/axiostest/libs/RestModel",
	"sap/base/Log"
], function (JSONModel, axiosjs, MetadataObjectFormatter, RestModel, Log) {
	"use strict";

	return JSONModel.extend("at.clouddna.axiostest.libs.TestClientModel", {
		_restModel: null,

		constructor: function (sPath, oParameter) {
			JSONModel.call(this);

			this._restModel = new RestModel({
				url: sPath,
				sendSkipTop: false,
			});

			if (oParameter) {
				if (oParameter.hasOwnProperty("initialLoadedEntities")) {
					let aEntityPromises = [],
						oData = {};

					oParameter.initialLoadedEntities.forEach(function (sEntity) {
						aEntityPromises.push(this._restModel.read("/" + sEntity));
					}.bind(this));

					Promise.all(aEntityPromises).then(function (aValues) {
						for (let h = 0; h < aValues.length; h++) {
							oData[oParameter.initialLoadedEntities[h]] = aValues[h].data.d.results;
						}

						this.setData(oData);
					}.bind(this));
				}
			}
		},

		loadData: function (sPath) {
			/*	this._restModel.read(sPath, {
					success: function (oData) {
						let oSetData = {

						}
						this.setData(oData.data);
					}.bind(this),
					error: function (oE) {

					}.bind(this)
				});*/
		},

		/*getProperty: function (oEvent) {

		},*/

		refreshEntitySet: function (sPath) {
			this._restModel.read(sPath, {
				success: function (oData) {
					this.getData()[sPath.substring(1)] = oData.data.d.results;
					this.refresh();
				}.bind(this),
				error: function (oError) {

				}
			});
		},

		bindList: function (sPath, oContext, aSorters, aFilters, mParameters) {
			let sendGet = false;

			if (mParameters) {
				sendGet = mParameters.hasOwnProperty("sendGet") ? mParameters.sendGet : sendGet;
			}

			sendGet = this.getData().hasOwnProperty(sPath.substring(1)) ? sendGet : true;

			if (sendGet) {
				this.refreshEntitySet(sPath);
			}

			return new sap.ui.model.json.JSONListBinding(this, sPath, oContext, aSorters, aFilters, mParameters);
		},

	});
});