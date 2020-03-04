sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"at/clouddna/axiostest/libs/axios",
	"at/clouddna/axiostest/libs/MetadataObjectFormatter",
	"at/clouddna/axiostest/libs/RestModel",
	"sap/base/Log"
], function (JSONModel, axiosjs, MetadataObjectFormatter, RestModel, Log) {
	"use strict";

	return JSONModel.extend("at.clouddna.axiostest.libs.CloudDNAModel", {
		_restModel: null,
		_aChanges: [],
		_oCopy: null,

		//Logger
		_logger: null,

		/**
		 * @constructor
		 * @public
		 * @param {string} sPath - Path to REST-Client.
		 * @param {object} oParameters - Parameters for CloudDNAModel.
		 * @param {Array} [oParameters.initialLoadedEntities] - URIs to Entities that should be initially loaded - e.g.: ["Customers", "Tasks"].
		 * @param {object} oConfig - Parameters for RestModel-Model.
		 * @param {number} [oConfig.timeout=5000] - Reqest timeout.
		 * @param {object} [oConfig.headers={}] - Request headers.
		 * @param {boolean} [oConfig.xcsrfTokenHandling=false] - Request headers.
		 */
		constructor: function (sPath, oParameters, oRestModelConfig) {
			JSONModel.call(this);

			if (sPath === undefined) {
				throw new ReferenceError("An URL to a REST-Client must be specified.");
			}

			//Config for the RestModel
			if (oRestModelConfig) {
				oRestModelConfig["url"] = sPath;
			} else {
				oRestModelConfig = {
					url: sPath
				};
			}

			this._restModel = new RestModel(oRestModelConfig);
			this._logger = Log.getLogger("CloudDNAModel", Log.Level.ALL);

			//Config for the CloudDNAModel
			if (oParameters) {
				if (oParameters.hasOwnProperty("initialLoadedEntities")) {
					let aEntityPromises = [],
						oData = {};

					oParameters.initialLoadedEntities.forEach(function (sEntity) {
						aEntityPromises.push(this._restModel.read("/" + sEntity));
					}.bind(this));

					//Read all predefined entities
					Promise.all(aEntityPromises).then(function (aValues) {
						for (let h = 0; h < aValues.length; h++) {
							oData[oParameters.initialLoadedEntities[h]] = aValues[h].data;
						}
						//set initial model data
						this.setData(oData);
						this._logger.info("Initial Data set.");
					}.bind(this));
				}
			}

			//save local changes on property-change-event
			this.attachPropertyChange(this._onPropertyChange.bind(this));
		},

		/**
		 * @function _onPropertyChange
		 * @private
		 * @param {sap.ui.base.Event} oEvent - ProperyChangeEvent.
		 */
		_onPropertyChange: function (oEvent) {
			let oParameters = oEvent.getParameters(),
				sPath = oParameters.path,
				oValue = oParameters.value,
				oChange = {};

			//make copy of local data on first property-change
			if (this._oCopy === null) {
				this._oCopy = JSON.parse(JSON.stringify(this.getData()));
			}

			//Aggregation-Binding
			if (oParameters.context) {
				oChange = {
					entity: oParameters.context.sPath,
					property: sPath,
					value: oValue
				};
			}
			//Property-Binding
			else {
				oChange = {
					entity: sPath.slice(0, sPath.lastIndexOf("/")),
					property: sPath.slice(sPath.lastIndexOf("/") + 1, sPath.length),
					value: oValue
				};
			}

			//overwrite change-value if a change-entry for this property exists
			let oFound = this._aChanges.find(e => e.property === oChange.property && e.entity === oChange.entity);

			if (oFound) {
				oFound.value = oChange.value;
			} else {
				this._aChanges.push(oChange);
			}

			this._logger.info("Property '" + oChange.entity + "/" + oChange.property + "' changed.");
		},

		/**
		 * @function submitLocalChanges
		 * @public
		 * @param {object} oParameters - Parameters for submitting the local changes.
		 * @param {boolean} [oParameters.sendOnlyChanged=false] - Submit only the changed Properties of the Entity(true) or submit the whole Entity(false)
		 * @param {function} [oParamerers.success=function(){}] - Success-callback function.
		 * @param {function} [oParamerers.error=function(){}] - Error-callback function.
		 */
		submitLocalChanges: function (oParameters) {
			let sendOnlyChanged = false,
				fnSuccess = function () {},
				fnError = function () {};

			if (oParameters) {
				sendOnlyChanged = oParameters.hasOwnProperty("sendOnlyChanged") ? oParameters.sendOnlyChanged : false;
				fnSuccess = oParameters.hasOwnProperty("success") ? oParameters.success : fnSuccess;
				fnError = oParameters.hasOwnProperty("error") ? oParameters.error : fnError;
			}

			//Map the different changes to their Entity
			let aSortedChanges = this._mapChanges(),
				aPromises = [];

			aSortedChanges.forEach(function (oChange) {
				let oEntity = this.getProperty(oChange.entity),
					sUrl = oChange.entity;

				if (sendOnlyChanged) {
					aPromises.push(this.restModel.update(sUrl, oChange.properties));
				} else {
					aPromises.push(this._restModel.update(sUrl, oEntity));
				}
			}.bind(this));

			//Submit all Changes via Promise.all
			this._logger.info("Submitting local changes.");
			Promise.all(aPromises).then(function (aResults) {
					//reset the Change-Objects
					this._oCopy = null;
					this._aChanges = null;

					this._logger.info("Changes submitted.");

					fnSuccess();
				}.bind(this),
				function (oError) {
					this._logger.error(JSON.stringify(oError));

					fnError();
				}.bind(this));
		},

		/**
		 * @function _mapChanges
		 * @private
		 * @returns {Array} aReturn - Retuns an Array with the mapped changes.
		 */
		_mapChanges: function () {
			let aReturn = [];

			//Run through all Change-Objects and combine them by their Entity
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

		/**
		 * @function hasLocalChanges
		 * @public
		 * @returns {boolean} - returns 'true' if local changes exist.
		 */
		hasLocalChanges: function () {
			return this._aChanges !== null;
		},

		/**
		 * @function getLocalChanges
		 * @public
		 * @returns {Array} - Returns the local changes.
		 */
		getLocalChanges: function () {
			return this._aChanges;
		},

		/**
		 * @function resetLocalChanges
		 * @public
		 */
		resetLocalChanges: function () {
			this.setData(JSON.parse(JSON.stringify(this._oCopy)));
			this._oCopy = null;
			this._aChanges = null;
			this.refresh();
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

		/**
		 * @function refreshEntitySet
		 * @public
		 * @param {string} sPath - Loads or refreshes a given Entity 
		 */
		refreshEntitySet: function (sPath) {
			if (!sPath || sPath === "") {
				throw new ReferenceError("Path to ressource must be specified");
			}

			this._restModel.read(sPath, {
				success: function (oData) {
					this.getData()[sPath.substring(1)] = oData.data;
					this.refresh();
				}.bind(this),
				error: function (oError) {

				}
			});
		},

		/**
		 * @function refreshEntitySet
		 * @public
		 * @override
		 * @param {string} sPath - URI to the binding Entity 
		 * @param {object} oContext - Context of the binding Entity 
		 * @param {Array} aSorters - Sorters for the binding Entity 
		 * @param {Array} aFilters - Filters for the binding Entity 
		 * @param {object} mParameters - Parameters for the binding Entity 
		 * Dont call explicitly, gets called by binding the Model to an Aggregation-Property!
		 */
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
		}

	});
});