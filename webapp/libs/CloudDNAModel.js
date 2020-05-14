sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"at/clouddna/axiostest/libs/RestModel",
	"sap/base/Log"
], function (JSONModel, RestModel, Log) {
	"use strict";

	return JSONModel.extend("at.clouddna.axiostest.libs.CloudDNAModel", {
		_restModel: null,
		_aChanges: null,
		_oCopy: null,

		//Key-Properties per entity-set
		_oKeysForEntitySet: {},

		//Logger
		_logger: null,

		/**
		 * @constructor
		 * @public
		 * @param {string} sPath - Path to REST-Client.
		 * @param {object} oParameters - Parameters for CloudDNAModel.
		 * @param {Array} [oParameters.initialLoadedEntities] - URIs to Entities that should be initially loaded - e.g.: ["Customers", "Tasks"].
		 * @param {Object} [oParameters.keysForEntitySet] - Key-Properties for an Entity-Set, needs to be provided for an entity-set where submitLocalChanges should work.
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
				this._oKeysForEntitySet = oParameters.hasOwnProperty("keysForEntitySet") ? oParameters.keysForEntitySet : this._oKeysForEntitySet;
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
				this._aChanges = [];
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

		setBearerToken: function (sToken) {
			this._restModel.addHeader({
				name: "Authorization",
				value: "Bearer " + sToken
			});
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

			if (this.hasLocalChanges()) {
				//Map the different changes to their Entity
				let aSortedChanges = this._mapChanges(),
					aPromises = [];

				aSortedChanges.forEach(function (oChange) {
					let oEntity = this.getProperty(oChange.entity),
						sUrl = oChange.entity,
						sEntitySet = sUrl.substring(1).slice(0, sUrl.substring(1).lastIndexOf("/"));

					if (this._oKeysForEntitySet[sEntitySet]) {

						sUrl = "/" + sEntitySet + "/" + oEntity[this._oKeysForEntitySet[sEntitySet]];

						if (sendOnlyChanged) {
							aPromises.push(this.restModel.update(sUrl, oChange.properties));
						} else {
							aPromises.push(this._restModel.update(sUrl, oEntity));
						}
					} else {
						this._logger.error("No Key-Propety for Entity-Set '" + sEntitySet + "' provided, changes won't be submitted");
					}
				}.bind(this));

				if (aPromises.length < 0) {
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
				} else {
					this._logger.error("Changes were found, but no Key-Properties were given for all changed Entitiy-Sets.");
				}
			} else {
				this._logger.info("No changes were found!");
			}
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

		/**
		 * @function addKeyForEntity
		 * @public
		 */
		addKeyForEntitySet: function (sEntity, sProperty) {
			if (sEntity === undefined || sEntity === "" || sProperty === undefined || sProperty === "") {
				throw new ReferenceError("Entity and Property must be specified");
			}

			this._oKeysForEntitySet[sEntity] = sProperty;
		},

		/**
		 * @function removeKeyForEntity
		 * @public 
		 * @returns {boolean}
		 */
		removeKeyForEntitySet: function (sEntity) {
			if (sEntity === undefined || sEntity === "") {
				throw new ReferenceError("Entity must be specified");
			}

			return delete this._oKeysForEntitySet[sEntity];
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
		 * @param {string} sPath - Loads or refreshes a given entity-set
		 * @param {object} oParameters - Parameters for refreshing an entity.
		 * @param {function} [oParamerers.success=function(){}] - Success-callback function.
		 * @param {function} [oParamerers.error=function(){}] - Error-callback function.
		 */
		refreshEntitySet: function (sPath, oParameters) {
			this._restModel.checkPath(sPath);

			//this._buildObjectFromPath("/blogs/comment/5/2/test", ["test1", "test2"]);

			this._restModel.read(sPath, {
				restUrlParameters: {
					param1: "testparam"
				},
				success: function (oData) {
					this._buildObjectFromPath(sPath, oData.data);

					this.refresh();

					this._logger.info("Entity refreshed");
					if (oParameters) {
						if (oParameters.hasOwnProperty("success")) {
							oParameters.success(oData);
						}
					}
				}.bind(this),
				error: function (oError) {
					this._logger.error(oError);
					if (oParameters) {
						if (oParameters.hasOwnProperty("error")) {
							oParameters.error(oError);
						}
					}
				}.bind(this)
			});
		},

		_buildObjectFromPath: function (sPath, oData) {
			let aPath = sPath.split("/"),
				sConcatPath = "";

			if (aPath[0] === "") {
				aPath.shift();
			}

			if (this.getProperty(sPath)) {
				this.setProperty(sPath, oData);
				return;
			}

			if (aPath.length === 1) {
				this.setProperty(sPath, oData);
				return;
			}
			for (let h = 0; h < aPath.length; h++) {
				sConcatPath += "/" + aPath[h];

				if (h === aPath.length - 1) {
					if (Array.isArray(oData)) {
						let sEntitySet = aPath.pop();

						if (this._oKeysForEntitySet[sEntitySet]) {
							let aArray = [];

							oData.forEach(function (oElement) {
								aArray[oElement[this._oKeysForEntitySet[sEntitySet]]] = oElement;
							}.bind(this));
							oData = aArray;
						} else {
							throw new ReferenceError("No Key-Property for Entity-Set '" + sEntitySet + "'provided!");
						}
					}
					this.setProperty(sConcatPath, oData);
				} else {
					if (parseInt(aPath[h])) {
						let sHPath = sConcatPath.slice(0, sConcatPath.lastIndexOf("/"));
						let aArray = [];
						aArray[parseInt(aPath[h])] = null;

						if (parseInt(aPath[h + 1])) {
							aArray[parseInt(aPath[h])] = [];
						} else {
							let oObject = {};
							oObject[aPath[h + 1]] = undefined;
							aArray[parseInt(aPath[h])] = oObject;
						}

						this.setProperty(sHPath, aArray);
					} else {
						this.setProperty(sConcatPath);

						if (parseInt(aPath[h + 1])) {
							let aArray = [];
							this.setProperty(sConcatPath, aArray);
						} else {
							let oObject = {};
							oObject[sPath[h + 1]] = undefined;
							this.setProperty(sConcatPath, oObject);
						}
					}
				}
			}
		},

		/**
		 * @function refreshEntity
		 * @public
		 * @param {string} sPath - Loads or refreshes a given Entity 
		 * @param {object} oParameters - Parameters for refreshing an entity.
		 * @param {function} [oParamerers.success=function(){}] - Success-callback function.
		 * @param {function} [oParamerers.error=function(){}] - Error-callback function.
		 */
		refreshEntity: function (sPath, oParameters) {
			this._restModel.checkPath(sPath);

			this._restModel.read(sPath, {
				success: function (oData) {
					let sEntitySet = oData.config.url;

					sEntitySet = sEntitySet.substring(1).slice(0, sEntitySet.substring(1).lastIndexOf("/"));

					if (this._oKeysForEntitySet[sEntitySet]) {
						if (this.getData()[sEntitySet]) {
							let oEntity = this.getData()[sEntitySet].find(e => e[this._oKeysForEntitySet[sEntitySet]] === oData.data[this._oKeysForEntitySet[
								sEntitySet]]);

							if (oEntity) {
								let iIdx = this.getData()[sEntitySet].indexOf(oEntity);

								this.getData()[sEntitySet][iIdx] = oData.data;
							} else {

								this.getData()[sEntitySet].unshift(oData.data);
							}
						} else {
							this.getData()[sEntitySet] = [oData.data];
						}

						this._logger.info("Entity refreshed");

						if (oParameters) {
							if (oParameters.hasOwnProperty("success")) {
								oParameters.success(oData);
							}
						}
					} else {
						this._logger.error("No Key-Property for Entity-Set provided!");

						if (oParameters) {
							if (oParameters.hasOwnProperty("error")) {
								oParameters.error("No Key-Property for Entity-Set provided!");
							}
						}
					}
				}.bind(this),
				error: function (oError) {
					this._logger.error(oError);
					if (oParameters) {
						if (oParameters.hasOwnProperty("error")) {
							oParameters.error(oError);
						}
					}
				}.bind(this)
			});
		},

		/**
		 * @function bindList
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
		},

		/*bindContext: function (sPath, oContext, mParameters, oEvents) {
			return new sap.ui.model.ContextBinding(sPath, oContext, mParameters, oEvents);
		},*/

		/**
		 * @function create - Calls RestModel.create
		 * @public
		 * @param {string} sPath - Path where a new ressource should be added.
		 * @param {object} sObject - Data which should be posted. 
		 * @param {object} [oParameters] - Parameter object for read-requests.
		 * @param {function} [oParamerers.success=function(){}] - Success-callback function.
		 * @param {function} [oParamerers.error=function(){}] - Error-callback function.
		 * @param {object} [oParameters.headers] - Send additional axios-header-parameters.
		 */
		create: function (sPath, sObject, oParameters) {
			return this._restModel.create(sPath, sObject, oParameters);
		},

		/**
		 * @function read - Calls RestModel.read(...)
		 * @public
		 * @param {string} sPath - Path to a ressource, absolute to the set base-url.
		 * @param {object} [oParameters] - Parameter object for read-requests.
		 * @param {function} [oParamerers.success=function(){}] - Success-callback function.
		 * @param {function} [oParamerers.error=function(){}] - Error-callback function.
		 * @param {object} [oParameters.headers] - Send additional axios-header-parameters.
		 * @param {object} [oParameters.restUrlParameters] - Additional URL-parameters for REST-calls.
		 * @param {Array} [oParamerers.select] - String-array for $select-parameter.
		 * @param {string} [oParamerers.filter] - String for $filter-parameter.
		 * @param {number} [oParamerers.skip=0] - Integer for $skip-parameter. Default is 0.
		 * @param {number} [oParamerers.top=100] - Integer for $top-parameter. Default is 100.
		 * @param {Array} [oParamerers.orderyb] - String-array for $orderby-parameter.
		 * @param {boolean} [oParameters.sendSkipTop=false] - Send default $top=100 and $skip=0.
		 * @returns {promise} [oPromise] - returns promise if no success- or error-callback was specified.
		 */
		read: function (sPath, oParameters) {
			return this._restModel.read(sPath, oParameters);
		},

		/**
		 * @function update - Calls RestModel.update(...)
		 * @public
		 * @param {string} sPath - Path where a new ressource should be added.
		 * @param {object} sObject - Data which should be posted. 
		 * @param {object} [oParameters] - Parameter object for read-requests.
		 * @param {function} [oParamerers.success=function(){}] - Success-callback function.
		 * @param {function} [oParamerers.error=function(){}] - Error-callback function.
		 * @param {object} [oParameters.headers] - Send additional axios-header-parameters.
		 */
		update: function (sPath, oObject, oParameters) {
			return this._restModel.update(sPath, oObject, oParameters);
		},

		/**
		 * @function remove - Calls RestModel.remove(...)
		 * @public
		 * @param {string} sPath - Path where a new ressource should be added.
		 * @param {object} [oParameters] - Parameter object for read-requests.
		 * @param {function} [oParamerers.success=function(){}] - Success-callback function.
		 * @param {function} [oParamerers.error=function(){}] - Error-callback function.
		 * @param {object} [oParameters.headers] - Send additional axios-header-parameters.
		 */
		remove: function (sPath, oParameters) {
			return this._restModel(sPath, oParameters);
		}
	});
});