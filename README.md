# CloudDNA Rest-Model
Beschreibung des CloudDNA RESTModels auf Basis von [axios](https://github.com/axios/axios).

# Installation

Für die Installation des CloudDNAModels werden folgende files benötigt:

 1. [ axios.js](https://github.com/ksicgmbh/RestModel/blob/master/webapp/libs/axios.js)
 2. [RestModel.js](https://github.com/ksicgmbh/RestModel/blob/master/webapp/libs/RestModel.js)
 3. [CloudDNAModel.js](https://github.com/ksicgmbh/RestModel/blob/master/webapp/libs/CloudDNAModel.js)

Diese Files werden in dem UI5-Projekt in den **webapp**-Folder in einen neuen Ordner eingefügt. Der Ordnername kann frei vergeben werden.

Anschließend müssen noch die Pfade auf die Verweise der anderen .js Files in zwei Files angepasst werden.

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

Alle CRUD-Funktionen des RESTModels liefern entweder einen **Pomise** zurück oder können einen **Success-/Error-Callback** bekommen. Sobald in dem Parameter-Objekt einer CRUD-Funktion keine Callback-Funktion definiert wird, wird ein Promise zurückgeliefert, der mit ***oPomise.then(fnSuccess, fnError)*** oder ***oPromise.then(fnSuccess).catch(fnError)*** abgearbeitet werden kann.

Das RESTModel unterstützt außerdem noch **X-CSRF-Tokenhandling**. Dieses kann entweder bei der Erstellung einer neuen RESTModel-Instanz per Parameter ***xcsrfTokenHandling*** oder zur Laufzeit mit der Funktion ***setXCSRFTokenHandling(true/false)*** eingestellt werden.

**Request-Header**, die für jeden Request gehen, können mit der Funktion ***addHeader***, bzw. mit ***removeHeader*** hinzugefürt, bzw. gelöscht werden.

## Instanz erstellen
Um das RestModel benutzen zu können, muss eine neue Instanz erstellt werden.

    new RestModel(oConfig)

    oConfig = {
	    {string} url - URL of REST-Client.
		{number} [timeout=5000] - Reqest timeout.
		{object} [headers={}] - Request headers.
		{boolean} [xcsrfTokenHandling=false] - Request headers.
    }

Ein Beispiel hierfür wäre:

    this._oModel = new RestModel({
    				url: "https://webidetestingxxxxxx-exxxxxxx.dispatcher.eu2.hana.ondemand.com/api",
    			});



## create
Die **create**-Methode des RESTModes benutzt die HTTP **POST**-Funktion, um neue Daten per REST-Call zu speichern.


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


Ein Beispiel hierfür wäre:

    this._oModel.create("/Customer", {
		    Firstname: "John",
		    Lastname: "Doe"
	    },{
		success: function (oData) {
			oCodeEditor.setValue(JSON.stringify(oData, null, "\t"));
		}.bind(this)
	});

## read

Die **read**-Methode des RESTModels benützt die HTTP **GET**-Funktion, um Daten zu laden.

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
Ein Beispiel hierfür wäre:

    this._oModel.read("/Customer", {
	     success: function (oData) { 
		     oCodeEditor.setValue(JSON.stringify(oData, null, "\t")); 
		 }.bind(this) 
	});

## update
Die **update**-Methode des RESTModels benützt die HTTP **PUT**-Funktion, um bestehende Datensätze zu ändern.

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

Ein Beispiel hierfür wäre:

    this._oModel.update(/Customer/7, JSON.parse(oBody.getValue()), {
 			success: function (oData) {
 				oResponse.setValue(JSON.stringify(oData, null, "\t"));
 			},
 			error: function (oError) {
 				oResponse.setValue(oError);
 			}
 	});

## remove
Die **remove**-Methode des RESTModels benützt die HTTP **DELETE**-Funktion, um bestehende Datensätze zu löschen.

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

Ein Beispiel hierfür wäre:

    this._oModel.remove(/Customer/1, {
  				success: function (oData) {
  					oResponse.setValue(JSON.stringify(oData, null, "\t"));
  				},
  				error: function (oError) {
  					oResponse.setValue(oError);
  				}
  	});

## bearerTokenLogin
Mit dieser Funktion lässt sich einfach das Bearer-Token setzen. Es müssen nur Username, Passwort und eine URL, wo der Token herkommt, mitgegeben werden. Die Funktion setzt dann den **Authorization**-Token, der für die weiteren Requests verwendet wird.

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
Über diese Funktion lässt sich das **X-CSRF-Tokenhandling** ein- oder ausschalten. Hierbei wird zuerst ein GET-Request mit einem Header namens **"X-CSRF-Token": "fetch"** geschickt. Das Restultat dieses Request beinhaltet das entsprechende X-CSRF-Token, das nun als Request-Header für alle CRUD-Requests eingesetzt wird.

    oModel.setXCSRFTokenHandling(bSetSecurityHeader)
    
    //parameters
    bSetSecurityHeader = {boolean} bSetSecurityHeader - Enable X-CSRF-Tokenhandling

## addHeader
Fügt einen neuen Default-Request-Header hinzu.

    oModel.addHeader(sHeaderName, sHeaderValue)
    
    //parameters
    oHeader = {
		 {string} sHeaderName - Header-Name.
		 {string} sHeaderValue - Header-Value.
	}

## removeHeader
Löscht einen Default-Request-Header aus dem Header-Objekt.

    oModel.removeHeader(sHeaderName)
    
    //parameters
    sHeaderName = string} sHeaderName - Header-Name.
    
    //returns
	returns {boolean} - Entry deleted or not.

## checkPath
Überprüft, ob ein übergebene URI ein semantisch korrekter Pfad ist.

    oModel.checkPath(sPath)
    
    //parameters
    sPath = {string} sPath - Absolute path to ressource.
		 
    //returns
    returns {string} sPath - Returns the path if no error was thrown.

# CloudDNAModel

.... Coming soon...



