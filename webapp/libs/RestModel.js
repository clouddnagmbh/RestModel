/* global axios:true */
sap.ui.define([
	"sap/ui/base/Object",
	"at/clouddna/axiostest/libs/axios",
	"sap/base/Log"
], function (Object, axiosjs, Log) {
	"use strict";

	/**
	 * @class 
	 * @author Maximilian  Olzinger [maximilian.olzinger@clouddna.at]
	 */
	return Object.extend("at.clouddna.axiostest.libs.ODataRestModel", {
		_axiosInstance: null,
		_sXSRFToken: "",

		_logger: null,

		/**
		 * @constructor
		 * @public
		 * @param {object} oConfig - Object for the initial axios-configuration.
		 * @param {string} oConfig.url - URL of REST-Client.
		 * @param {number} [oConfig.timeout=5000] - Reqest timeout.
		 * @param {object} [oConfig.headers={}] - Request headers.
		 * @param {boolean} [oConfig.xcsrfTokenHandling=false] - Request headers.
		 */
		constructor: function (oConfig) {
			Object.call(this);

			//if no configuration was provided, throw an exception
			if (oConfig === undefined) {
				throw new ReferenceError("RestModel must be configured with a config-object");
			} else if (!oConfig.hasOwnProperty("url")) {
				//if no url to a service was provided, throw an exception
				throw new ReferenceError("The property 'url' in the function-parameter must be specified");
			}

			this._logger = Log.getLogger("RestModel", Log.Level.ALL);

			//create a new axios-instance
			this._axiosInstance = axios.create({
				baseURL: oConfig.url,
				timeout: oConfig.hasOwnProperty("timeout") ? oConfig.timeout : "5000",
				headers: oConfig.hasOwnProperty("headers") ? oConfig.headers : {},
			});

			this._logger.info("Instance created");

			//fetch x-csrf-token if available
			this.setXCSRFTokenHandling(oConfig.hasOwnProperty("xcsrfTokenHandling") ? oConfig.xcsrfTokenHandling : false);
		},

		/**
		 * @function create
		 * @public
		 * @param {string} sPath - Path where a new ressource should be added.
		 * @param {object} oObject - Data which should be posted. 
		 * @param {object} [oParameters] - Parameter object for read-requests.
		 * @param {function} [oParamerers.success=function(){}] - Success-callback function.
		 * @param {function} [oParamerers.error=function(){}] - Error-callback function.
		 * @param {object} [oParameters.headers] - Send additional axios-header-parameters.
		 */
		create: function (sPath, oObject, oParameters) {
			let fnSuccess = function (oResponse) {},
				fnError = function (oError) {},
				bReturnPromise = true,
				oHeaders = {};

			//definition of callback functions if oParameters!=undefined
			if (oParameters) {
				fnSuccess = oParameters.hasOwnProperty("success") ? oParameters.success : fnSuccess;
				fnError = oParameters.hasOwnProperty("error") ? oParameters.error : fnError;

				bReturnPromise = !(oParameters.hasOwnProperty("success") || oParameters.hasOwnProperty("error"));

				oHeaders = oParameters.hasOwnProperty("headers") ? oParameters.headers : oHeaders;
			}

			//if no callback function was provided, return a promise
			if (bReturnPromise) {
				this._logger.info("POST - sent (promise)");
				return this._axiosInstance.post(sPath, oObject || {}, oHeaders);
			}

			//create with callback functions
			this._logger.info("POST - sent (callback)");
			this._axiosInstance.post(sPath, oObject || {}, oHeaders).then(fnSuccess, fnError);
		},

		/**
		 * @function read
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
			sPath = this.checkPath(sPath);

			let fnSuccess = function (oResponse) {},
				fnError = function (oError) {},
				bReturnPromise = true,
				oHeaders = {};

			//definition of callback functions if oParameters!=undefined
			if (oParameters) {
				fnSuccess = oParameters.hasOwnProperty("success") ? oParameters.success : fnSuccess;
				fnError = oParameters.hasOwnProperty("error") ? oParameters.error : fnError;

				bReturnPromise = !(oParameters.hasOwnProperty("success") || oParameters.hasOwnProperty("error"));

				//URL parameters specific
				let sSelect = oParameters.hasOwnProperty("select") ? oParameters.select.join(",") : "",
					sFilter = oParameters.hasOwnProperty("filter") ? oParameters.filter : "",
					iSkip = oParameters.hasOwnProperty("skip") ? oParameters.skip : 0,
					iTop = oParameters.hasOwnProperty("top") ? oParameters.top : 100,
					sOrderby = oParameters.hasOwnProperty("orderby") ? oParameters.orderby.join(",") : "",
					bSendSkipTop = oParameters.hasOwnProperty("sendSkipTop") ? oParameters.sendSkipTop : false,
					aParams = [];

				aParams.push(sSelect === "" ? sSelect : "$select=" + sSelect);
				aParams.push(sFilter === "" ? sFilter : "$filter=" + sFilter);
				aParams.push(bSendSkipTop ? "$skip=" + iSkip : "");
				aParams.push(bSendSkipTop ? "$top=" + iTop : "");
				aParams.push(sOrderby === "" ? sOrderby : "$orderby=" + sOrderby);

				aParams = aParams.filter(e => e !== "");
				aParams = aParams.join("&");

				sPath = aParams !== "" ? sPath + "?" + aParams : sPath;

				//Request headers - submitted once
				oHeaders = oParameters.hasOwnProperty("headers") ? oParameters.headers : oHeaders;

				//REST specific
				if (oParameters.hasOwnProperty("restUrlParameters")) {
					let sRestParams = "",
						oRestParams = oParameters.restUrlParameters,
						aRestParams = [];

					for (let sKey in Object.keys(oRestParams)) {
						aRestParams.push(sKey + "=" + oRestParams[sKey]);
					}

					sRestParams = aRestParams.join("&");

					sPath = aParams === "" ? sPath + "?" + sRestParams : sPath + "&" + sRestParams;
				}

			} else {
				this._logger.warning("GET - no parameters");
			}

			//if no callback function was provided, return a promise
			if (bReturnPromise) {
				this._logger.info("GET - sent on '" + sPath + "'(promise)");
				return this._axiosInstance.get(sPath, oHeaders);
			}

			//read with callback functions
			this._logger.info("GET - sent on '" + sPath + "'(callback)");
			this._axiosInstance.get(sPath, oHeaders).then(fnSuccess, fnError);
		},

		/**
		 * @function update
		 * @public
		 * @param {string} sPath - Path where a new ressource should be added.
		 * @param {object} sObject - Data which should be posted. 
		 * @param {object} [oParameters] - Parameter object for read-requests.
		 * @param {function} [oParamerers.success=function(){}] - Success-callback function.
		 * @param {function} [oParamerers.error=function(){}] - Error-callback function.
		 * @param {object} [oParameters.headers] - Send additional axios-header-parameters.
		 */
		update: function (sPath, oObject, oParameters) {
			let fnSuccess = function (oResponse) {},
				fnError = function (oError) {},
				bReturnPromise = true,
				oHeaders = {};

			//definition of callback functions if oParameters!=undefined
			if (oParameters) {
				fnSuccess = oParameters.hasOwnProperty("success") ? oParameters.success : fnSuccess;
				fnError = oParameters.hasOwnProperty("error") ? oParameters.error : fnError;

				bReturnPromise = !(oParameters.hasOwnProperty("success") || oParameters.hasOwnProperty("error"));

				oHeaders = oParameters.hasOwnProperty("headers") ? oParameters.headers : oHeaders;
			}

			//if no callback function was provided, return a promise
			if (bReturnPromise) {
				this._logger.info("PUT - sent on '" + sPath + "'(promise)");
				return this._axiosInstance.put(sPath, oObject || {}, oHeaders);
			}

			//update with callback functions
			this._logger.info("PUT - sent on '" + sPath + "'(callback)");
			this._axiosInstance.put(sPath, oObject || {}, oHeaders).then(fnSuccess, fnError);
		},

		/**
		 * @function remove
		 * @public
		 * @param {string} sPath - Path where a new ressource should be added.
		 * @param {object} [oParameters] - Parameter object for read-requests.
		 * @param {function} [oParamerers.success=function(){}] - Success-callback function.
		 * @param {function} [oParamerers.error=function(){}] - Error-callback function.
		 * @param {object} [oParameters.headers] - Send additional axios-header-parameters.
		 */
		remove: function (sPath, oParameters) {
			sPath = this.checkPath(sPath);

			let fnSuccess = function (oResponse) {},
				fnError = function (oError) {},
				bReturnPromise = true,
				oHeaders = {};

			//definition of callback functions if oParameters!=undefined
			if (oParameters) {
				fnSuccess = oParameters.hasOwnProperty("success") ? oParameters.success : fnSuccess;
				fnError = oParameters.hasOwnProperty("error") ? oParameters.error : fnError;

				bReturnPromise = !(oParameters.hasOwnProperty("success") || oParameters.hasOwnProperty("error"));

				oHeaders = oParameters.hasOwnProperty("headers") ? oParameters.headers : oHeaders;
			} else {
				this._logger.warning("DELETE - no parameters");
			}

			//if no callback function was provided, return a promise
			if (bReturnPromise) {
				this._logger.info("DELETE - sent on '" + sPath + "'(promise)");
				return this._axiosInstance.delete(sPath, oHeaders);
			}

			//remove with callback functions
			this._logger.info("DELETE - sent on '" + sPath + "'(callback)");
			this._axiosInstance.delete(sPath, oHeaders).then(fnSuccess, fnError);

		},

		/**
		 * @function _getXCSRFToken 
		 * @public
		 * @param {boolean} bSetSecurityHeader - Enable X-CSRF-Tokenhandling
		 */
		setXCSRFTokenHandling: function (bSetSecurityHeader) {
			if (bSetSecurityHeader) {
				this._axiosInstance.get("/", {
					headers: {
						"X-CSRF-Token": "fetch"
					}
				}).then(function (oData) {
						this._logger.info("X-CSRF-Token fetched");
						this._sXSRFToken = oData.headers["x-csrf-token"];
						this._axiosInstance.defaults.headers['x-csrf-token'] = oData.headers["x-csrf-token"];
					}.bind(this),
					function (oError) {
						this._logger.error("No X-CSRF-Token available: " + oError);
					}.bind(this));
			} else {
				delete this._axiosInstance.defaults.headers['x-csrf-token'];
				this._logger.warning("X-CSRF-Tokenhanling disabled");
			}
		},

		/**
		 * @function checkPath
		 * @private
		 * @param {string} sPath - Absolute path to ressource.
		 * @returns {string} sPath - Returns the path if no error was thrown.
		 */
		checkPath: function (sPath) {
			//Path to ressource needs to be specified
			if (!sPath || sPath === "") {
				throw new ReferenceError("Path to ressource must be specified");
			}

			//sPath needs to be String
			if (typeof sPath !== "string") {
				throw new TypeError("Path needs to be typeof 'string'");
			}

			//sPath needs to be absolute
			if (sPath.charAt(0) !== "/") {
				throw new Error("Path needs to be absolute from the base path -> '/' is missing");
			}

			this._logger.info("Path '" + sPath + "'is valid");
			return sPath;
		}
	});
});