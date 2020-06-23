# CloudDNA Rest-Model
Description of the CloudDNA Rest Model based on [axios](https://github.com/axios/axios).

# Introduction
The RestModel makes working with **REST-Services** in SAP UI5 a lot easier by providing semantically known functions in order to help to call CRUD-Functions. The method-names and parameters are based on **ODataModel**-Methods to make working with the RestModel more familiar.

# Installation

Following 2 Files are needed in order to install the CloudDNA Rest Model.

 1. [ axios.js](https://github.com/ksicgmbh/RestModel/blob/master/webapp/libs/axios.js)
 2. [RestModel.js](https://github.com/ksicgmbh/RestModel/blob/master/webapp/libs/RestModel.js)

These files need to be placed in the **webapp** folder (can be placed in an subordinate folder). 

After that, the resource path in the **RestModel.js** needs to be changed in order to match the new folder structure.

***CloudDNAModel.js***

    sap.ui.define([
    	"sap/ui/model/json/JSONModel",
    	"myfolderpath/libs/RestModel",
    	"sap/base/Log"
    ], function (JSONModel, RestModel, Log) {
    ...
    }

***RestModel.js***

    /* global axios:true */
    sap.ui.define([
    	"sap/ui/base/Object",
    	"myfolderpath/axios",
    	"sap/base/Log"
    ], function (Object, axiosjs, Log) {

# RESTModel
All CRUD-Functionalities of the Rest model return a promise containing the result or can be called by providing an **Success-/Error-Callback**. When no callbacks are defined in the Parameter-Object of the corresponding call, a Promise is returned, which can be processed by using ***oPomise.then(fnSuccess, fnError)*** or ***oPromise.then(fnSuccess).catch(fnError)*** .

In addition, the RESTModel supports **X-CSRF-Tokenhandling**. This can be enabled by simply providing the ***xcsrfTokenHandling***-Parameter when instantiating a new RESTModel or by calling the ***setXCSRFTokenHandling***-Method.

**Request-Header** which should be applied in general can be added and removed by calling ***addHeader*** or ***removeHeader***.

## Instantiating
To use the RESTModel, a new instance needs to be created which consumes starting parameters.
    
	new RestModel(oConfig)
	
    oConfig = {
	    {string} url - URL of REST-Client.
		{number} [timeout=5000] - Reqest timeout.
		{object} [headers={}] - Request headers.
		{boolean} [xcsrfTokenHandling=false] - Request headers.
    }

An example would be:

    this._oModel = new RestModel({
    				url: "https://webidetestingxxxxxx-exxxxxxx.dispatcher.eu2.hana.ondemand.com/api",
    			});


## Access via Destination
To use a **Cloud Platform Destination**, an entry referring to said Destination needs to be created in the **neo-app.json**. This Entry serves as a **mapping** between the Destination and an entry-path, which is used as **base-path/url** in the RESTModel.


     {
    	"path": "/api",
    	"target": {
    		"type": "destination",
    		"name": "MyDestination"
    	},
    	"description": "My Destination"
    }

After adding a mapping in the neo-app.json, the value of the path-property can be used when instantiating a new RESTModel.
## create
The **create**-Method of the RESTModes uses HTTP **POST** to create new entries.

    oModel.create(sPath, sObject, oParameters)

	//parameters
    sPath =  {string} sPath - Path where a new ressource should be added.
    oObject = {object} oObject - Data which should be posted. 
    oParameters = {
	    {function} [success=function(){}] - Success-callback function.
		{function} [error=function(){}] - Error-callback function.
		{object} [headers] - Send additional axios-header-parameters.
    }
    
    //returns 
	returns {promise} [oPromise] - returns promise if no success- or error-callback was specified.


An example would be:

    this._oModel.create("/Customer", {
		    Firstname: "John",
		    Lastname: "Doe"
	    },{
		success: function (oData) {
			oCodeEditor.setValue(JSON.stringify(oData, null, "\t"));
		}.bind(this)
	});

## read

The **read**-Method of the RESTModels uses HTTP **GET** to read external data.

    oModel.read(sPath, oParameters) 
    
    //parameters
    sPath = {string} sPath - Path to a ressource, absolute to the set base-url.
	oParameters = {
		 {function} [success=function(){}] - Success-callback function.
		 {function} [error=function(){}] - Error-callback function.
		 {object} [headers] - Send additional axios-header-parameters.
		 {object} [restUrlParameters] - Additional URL-parameters for REST-calls.
		 {Array} [select] - String-array for $select-parameter.
		 {string} [filter] - String for $filter-parameter.
		 {number} [skip=0] - Integer for $skip-parameter. Default is 0.
		 {number} [top=100] - Integer for $top-parameter. Default is 100.
		 {Array} [orderyb] - String-array for $orderby-parameter.
		 {boolean} [sendSkipTop=false] - Send default $top=100 and $skip=0.
	}
	
	//returns 
	returns {promise} [oPromise] - returns promise if no success- or error-callback was specified.
An example would be:

    this._oModel.read("/Customer", {
	     success: function (oData) { 
		     oCodeEditor.setValue(JSON.stringify(oData, null, "\t")); 
		 }.bind(this) 
	});

## update
The **update**-Method of the RESTModels uses HTTP **PUT** to alter external data.

    oModel.update(sPath, oObject, oParameters)
    
	//parameters
    sPath = {string} sPath - Path where a new ressource should be added.
	oObject = {object} sObject - Data which should be posted. 
	oParameters = {
		 {function} [success=function(){}] - Success-callback function.
		 {function} [error=function(){}] - Error-callback function.
		 {object} [headers] - Send additional axios-header-parameters.
	}
	
	//returns 
	returns {promise} [oPromise] - returns promise if no success- or error-callback was specified.

An example would be:

    this._oModel.update(/Customer/7, JSON.parse(oBody.getValue()), {
 			success: function (oData) {
 				oResponse.setValue(JSON.stringify(oData, null, "\t"));
 			},
 			error: function (oError) {
 				oResponse.setValue(oError);
 			}
 	});

## remove
The **remove**-Method of the RESTModels uses HTTP **DELETE** to remove data.

    oModel.remove(sPath, oParameters)
    
    //parameters
    sPath = {string} sPath - Path where a new ressource should be added.
	oParameters = {object} {
		 {function} [success=function(){}] - Success-callback function.
		 {function} [error=function(){}] - Error-callback function.
		 {object} [headers] - Send additional axios-header-parameters.
	}
	
	//returns 
	returns {promise} [oPromise] - returns promise if no success- or error-callback was specified.

An example would be:

    this._oModel.remove(/Customer/1, {
  				success: function (oData) {
  					oResponse.setValue(JSON.stringify(oData, null, "\t"));
  				},
  				error: function (oError) {
  					oResponse.setValue(oError);
  				}
  	});

## bearerTokenLogin

By using the **bearerTokenLogin**-Method, one can authenticate himself against provided service. After the authorization passed successfully, the **Authorization**-Token is fetched and set  for further requests. (Service must provide a Bearer Token).

    oModel.bearerTokenLogin: function (sUrl, sUsername, sPassword, oParameters) 
    
    //parameters
    sUrl = {string} - Url for login.
    sUsername = {string} - Username.
    sPassword = {string} - Password.
    oParameters = {
	    success = {function}  - Success-callback function.
	    error = {function}  - Error-callback function.
    }
    

## setXCSRFTokenHandling
This method en- or disables **X-CSRF-Tokenhandling**. The Model sends a GET-Request with the **"X-CSRF-Token": "fetch"**-Header. The Result of the Requets is set as CSRF-token which is used as an header attribute for further requests.

    oModel.setXCSRFTokenHandling(bSetSecurityHeader)
    
    //parameters
    bSetSecurityHeader = {boolean} bSetSecurityHeader - Enable X-CSRF-Tokenhandling

## addHeader
Adds a new default header.

    oModel.addHeader(oHeader)
    
    //parameters
    oHeader = {
		 {string} name - Header-Name.
		 {value} value - Header-Value.
	}

## removeHeader
Removes a default header.

    oModel.removeHeader(sHeaderName)
    
    //parameters
    sHeaderName = string} sHeaderName - Header-Name.
    
    //returns
	returns {boolean} - Entry deleted or not.

## checkPath
Checks, if the given Path is syntactically correct. Is called by all RESTModel-Requests.

    oModel.checkPath(sPath)
    
    //parameters
    sPath = {string} sPath - Absolute path to ressource.
		 
    //returns
    returns {string} sPath - Returns the path if no error was thrown.
    
# Additional Infos

 - [Contribution Guide](https://git-scm.com/book/en/v2/GitHub-Contributing-to-a-Project)
 - [Code of Conduct](https://github.com/ksicgmbh/RestModel/blob/master/contribution.md)
 - [MIT License](https://github.com/ksicgmbh/RestModel/blob/master/LICENSE)

# Credits
Credits to Matt Zabriskie and his wonderful [axios-Model](https://github.com/axios/axios). Please check out his work for more Details about the axios-Model.

