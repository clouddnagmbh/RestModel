sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/model/json/JSONModel"
], function (Object, JSONModel) {
	"use strict";

	return Object.extend("at.clouddna.axiostest.libs.MetadataObjectFormatter", {

		_oMetadataFile: null,
		constructor: function (oMetadataFile) {
			this._oMetadataFile = oMetadataFile;
		},

		asyncFormat: function () {
			return new Promise(function (resolve, reject) {
				try {
					let oFormattedFile = {
						"entities": this._getEntities(),
						"entitySets": this._getEntitySets(),
						"associations": this._getAssociations(),
						"complexTypes": this._getComplexTypes(),
						"functions": this._getFunctions(),
					};

					resolve(oFormattedFile);
				} catch (oError) {
					reject(oError);
				}
			}.bind(this));
		},

		format: function () {
			let oFormattedFile = {
				"entities": this._getEntities(),
				"entitySets": this._getEntitySets(),
				"associations": this._getAssociations(),
				"complexTypes": this._getComplexTypes(),
				"functions": this._getFunctions(),
			};

			return oFormattedFile;
		},

		_getEntities: function () {
			let aSchemas = this._oMetadataFile.dataServices.schema,
				aReturn = [];

			aSchemas.forEach(function (oSchema) {
				if (oSchema.hasOwnProperty("entityType")) {
					oSchema.entityType.forEach(function (oEntityType) {
						let oEntity = {
							name: oEntityType.name,
							isMediaEntity: oEntityType.hasOwnProperty("hasStream"),
							key: [],
							properties: [],
							navigationProperties: []
						};

						//get entity-keys
						if (oEntityType.hasOwnProperty("key")) {
							oEntityType.key.propertyRef.forEach(function (oKey) {
								oEntity.key.push({
									name: oKey.name
								});
							});
						}

						//get entity-properties
						if (oEntityType.hasOwnProperty("property")) {
							oEntityType.property.forEach(function (oProperty) {
								let bCreatable = true,
									bUpdatable = true

								if (oProperty.hasOwnProperty("extensions")) {
									oProperty.extensions.forEach(function (oExtension) {
										if (oExtension.name === "creatable") {
											bCreatable = oExtension.value === "false" ? false : true;
										}

										if (oExtension.name === "updatable") {
											bUpdatable = oExtension.value === "false" ? false : true;
										}
									});
								}

								oEntity.properties.push({
									name: oProperty.name,
									type: oProperty.type,
									additionalInfo: JSON.stringify(oProperty),
									creatable: bCreatable,
									updatable: bUpdatable
								})
							});
						}

						if (oEntityType.hasOwnProperty("navigationProperty")) {
							oEntityType.navigationProperty.forEach(function (oNavigationProperty) {
								oEntity.navigationProperties.push({
									name: oNavigationProperty.name,
									from: oNavigationProperty.fromRole,
									to: oNavigationProperty.toRole
								})
							});
						}
						//get entity-navigationproperties

						//push to entity-Array
						aReturn.push(oEntity);
					});
				}
			});

			return aReturn;
		},

		_getComplexTypes: function () {
			let aSchemas = this._oMetadataFile.dataServices.schema,
				aReturn = [];

			aSchemas.forEach(function (oSchema) {
				if (oSchema.hasOwnProperty("complexType")) {
					oSchema.complexType.forEach(function (oComplexType) {
						let oData = {
							name: oComplexType.name,
							properties: []
						};

						//get complex-type-properties
						if (oComplexType.hasOwnProperty("property")) {
							oComplexType.property.forEach(function (oProperty) {
								oData.properties.push({
									name: oProperty.name,
									type: oProperty.type,
									additionalInfo: JSON.stringify(oProperty)
								});
							});
						} else {
							oData.properties.push({
								name: oComplexType.name,
								type: oComplexType.baseType,
								additionalInfo: "Base-Type: " + oComplexType.baseType,
							});
						}

						aReturn.push(oData);
					});
				}
			});

			return aReturn;
		},

		_getEntitySets: function () {
			let aSchemas = this._oMetadataFile.dataServices.schema,
				aReturn = [];

			aSchemas.forEach(function (oSchema) {
				if (oSchema.hasOwnProperty("entityContainer")) {
					oSchema.entityContainer.forEach(function (oEntityContainer) {
						oEntityContainer.entitySet.forEach(function (oEntitySet) {
							//get all entity-sets
							aReturn.push({
								name: oEntitySet.name,
								entity: oEntitySet.entityType
							});
						});
					});
				}
			});

			return aReturn;
		},

		_getAssociations: function () {
			let aSchemas = this._oMetadataFile.dataServices.schema,
				aReturn = [];

			aSchemas.forEach(function (oSchema) {
				if (oSchema.hasOwnProperty("association")) {
					oSchema.association.forEach(function (oAssociation) {
						let oData = {
							name: oAssociation.name,
							ends: []
						};

						//get association-ends
						oAssociation.end.forEach(function (oEnd) {
							oData.ends.push({
								role: oEnd.role,
								entity: oEnd.type,
								multiplicity: oEnd.multiplicity
							});
						});

						aReturn.push(oData);
					});
				}
			});
			return aReturn;
		},

		_getFunctions: function () {
			let aSchemas = this._oMetadataFile.dataServices.schema,
				aReturn = [];

			aSchemas.forEach(function (oSchema) {
				if (oSchema.hasOwnProperty("entityContainer")) {
					oSchema.entityContainer.forEach(function (oEntityContainer) {
						if (oEntityContainer.hasOwnProperty("functionImport")) {
							oEntityContainer.functionImport.forEach(function (oFunction) {
								//get all functions
								aReturn.push({
									name: oFunction.name,
									entitySet: oFunction.entitySet,
									httpMethod: oFunction.httpMethod,
									parameters: oFunction.parameter
								});
							});
						}
					});
				}
			});

			return aReturn;
		},

		getMetadataFile: function () {
			return this._oMetadataFile;
		},

		setMetadataFile: function (oMetadataFile) {
			this._oMetadataFile = oMetadataFile;
		}
	});
});