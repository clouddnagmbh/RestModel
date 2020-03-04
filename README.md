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
Die create-Methode des RestModes benutzt die HTTP **POST**-Funktion, um neue Daten per REST-Call zu speichern.


    oModel.create(sPath, sObject, oParameters)

    sPath =  {string} sPath - Path where a new ressource should be added.
    oObject = {object} oObject - Data which should be posted. 
    oParameters = {
	    {function} [success=function(){}] - Success-callback function.
		{function} [error=function(){}] - Error-callback function.
		{object} [headers] - Send additional axios-header-parameters.
    }

Ein Beispiel hierfür wäre:

    this._oModel.read("/Customers", {
		success: function (oData) {
			oCodeEditor.setValue(JSON.stringify(oData, null, "\t"));
		}.bind(this)
	});

## read

## update

## remove



# CloudDNAModel

