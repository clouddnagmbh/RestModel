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
		_aChanges: [],
		_oCopy: null,

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
			this.attachPropertyChange(function (oEvent) {
				let oParameters = oEvent.getParameters(),
					sPath = oParameters.path,
					oValue = oParameters.value,
					oChange = {};

				if (this._oCopy === null) {
					this._oCopy = JSON.parse(JSON.stringify(this.getData()));
				}

				if (oParameters.context) {
					oChange = {
						entity: oParameters.context.sPath,
						property: "/" + sPath,
						value: oValue
					};
				} else {
					oChange = {
						entity: sPath.slice(sPath.lastIndexOf("/"), sPath.length),
						property: sPath.slice(0, sPath.lastIndexOf("/")),
						value: oValue,
					};
				}

				let oFound = this._aChanges.find(e => e.property === oChange.property && e.entity === oChange.entity);

				if (oFound) {
					oFound.value = oChange.value;
				} else {
					this._aChanges.push(oChange);
				}

				console.log(this._aChanges);
			}.bind(this));
		},

		submitLocalChanges: function (oParameters) {
			let bSendSingle = false;
			if (oParameters) {
				bSendSingle = oParameters.hasOwnProperty("sendSingle") ? oParameters.sendSingle : false;
			}

			let aSortedChanges = this._mapChanges();

			//this._oCopy = null;
			//this._aChanges = null;
		},

		_mapChanges: function () {
			let aReturn = [];

			this._aChanges.forEach(function (oChange) {
				if (aReturn === []) {
					let oProperty = {};
					oProperty[oChange.property] = oChange.value;

					aReturn.push({
						entity: oChange.entity,
						properties: oProperty
					});
				} else {
					let oFound = aReturn.find(e => e.entity === oChange.entity);

					if (oFound) {
						oFound.properties[oChange.property] = oChange.value;
					} else {
						let oProperty = {};
						oProperty[oChange.property] = oChange.value;

						aReturn.push({
							entity: oChange.entity,
							properties: oProperty
						});
					}
				}
			}.bind(this));

			return aReturn;
		},

		hasLocalChanges: function () {
			return this._aChanges !== null;
		},

		resetLocalChanges: function () {
			this.setData(JSON.parse(JSON.stringify(this._oCopy)));
			this._oCopy = null;
			this._aChanges = null;
		},

		/*bindProperty: function (sPath, oContext, aSorters, aFilters, mParameters) {
				let oPropertyBinding = new sap.ui.model.json.JSONPropertyBinding(this, sPath, oContext, aSorters, aFilters, mParameters);
				var oParameters = aSorters;

				if (oParameters) {
					if (oParameters.hasOwnProperty("instantSubmit") ? oParameters.instantSubmit : false) {
						oPropertyBinding.attachChange(function (oEvent) {
							let oDataState = oEvent.getSource().oDataState;

							if (oDataState.hasOwnProperty("mProperties") && oDataState.hasOwnProperty("mChangedProperties")) {
								console.log("changed")
							}
						}.bind(this));
					}
				}
				return oPropertyBinding;
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