/*
	This file is part of NiuEdit.

	NiuEdit is free software: you can redistribute it and/or modify
	it under the terms of the GNU Affero General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	any later version.

	NiuEdit is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU Affero General Public License for more details.

	You should have received a copy of the GNU Affero General Public License
	along with NiuEdit.  If not, see <http://www.gnu.org/licenses/>.
*/

/*
	NiuEdit
	Web thematic and simple OpenStreetMap editor.
	Author: Adrien PAVIE

	Model classes, managing the handled data.
*/

/**
 * This class converts a list of potential objects from theme into an OAPI Query
 */
OapiQuery = function(potentials) {
//ATTRIBUTES
	/** The OAPI query **/
	this._query = null;

//CONSTRUCTOR
	//Check potentials
	if(potentials == null || potentials == undefined || !potentials instanceof Array || potentials.length == 0) {
		throw Error("Invalid potential tags");
	}
	
	//Query start
	this._query = '[out:json][timeout:25];(';
	
	//Query content
	var txt, potential, val, valSplit;
	for(var i=0, l=potentials.length; i < l; i++) {
		txt = '';
		potential = potentials[i];
		
		for(k in potential) {
			val = potential[k];
			valSplit = val.split('|');
			
			if(val == "*") {
				txt += '["'+k+'"]';
			}
			else if(valSplit.length == 1) {
				txt += '["'+k+'"="'+val+'"]';
			}
			else {
				txt += '["'+k+'"~"^('+val+')$"]';
			}
		}
		
		this._query += 'node'+txt+'({{bbox}});way'+txt+'({{bbox}});relation'+txt+'({{bbox}});';
	}
	
	//Query end
	this._query += ');out body center;';
	
	return this;
};

//ACCESSORS
	/**
	 * @param bbox The leaflet BBox object
	 * @return The query string for OAPI request
	 */
	OapiQuery.prototype.get = function(bbox) {
		var bboxStr = normLat(bbox.getSouth())+","+normLon(bbox.getWest())+","+normLat(bbox.getNorth())+","+normLon(bbox.getEast());
		return this._query.replace(/\{\{bbox\}\}/g, bboxStr);
	};

/**********************************************************************************/

/**
 * OSMData is a container for OSM data downloaded from Overpass API
 */
OSMData = function(bbox, data) {
//ATTRIBUTES
	/** The feature objects **/
	this._features = {};
	
	/** The bounding box of the data **/
	this._bbox = bbox;

//CONSTRUCTOR
	//Check OSM data
	if(!data) {
		console.error(data);
		throw new Error("Invalid data");
	}
	
	//Create features
	var f, id, currentFeature;
	for(var i=0, l = data.elements.length; i < l; i++) {
		f = data.elements[i];
		id = f.type+"/"+f.id;
		
		if(this._features[id] == undefined) {
			this._features[id] = new SimpleFeature(f);
		}
	}
	
	//Clean temporary objects
	f = null;
	id = null;
	currentFeature = null;
};

//ACCESSORS
	/**
	* @return The data bounding box
	*/
	OSMData.prototype.getBBox = function() {
		return this._bbox;
	};
	
	/**
	 * @return The features as an array
	 */
	OSMData.prototype.getFeatures = function() {
		return this._features;
	};
	
	/**
	 * @return The wanted feature
	 */
	OSMData.prototype.getFeature = function(id) {
		return this._features[id];
	};

/**********************************************************************************/

/**
 * A simple feature is a simple version of an OSM object, with an ID, tags and a center position
 */
SimpleFeature = function(f) {
//ATTRIBUTES
	/** The OSM ID (for example "123456") **/
	this._id = f.type+"/"+f.id;
	
	/** The OSM object tags **/
	this._tags = f.tags;
	
	/** The position of the centroid */
	this._center = (f.type == "node") ? L.latLng(f.lat, f.lon) : L.latLng(f.center.lat, f.center.lon);
	
	/** The list of tags edited by user **/
	this._editedTags = null;
	
	return this;
};

//ACCESSORS
	/**
	 * @return The OSM Id
	 */
	SimpleFeature.prototype.getId = function() {
		return this._id;
	};
	
	/**
	 * @return The OSM tags
	 */
	SimpleFeature.prototype.getTags = function() {
		return this._tags;
	};
	
	/**
	 * @param key The OSM key
	 * @return The corresponding OSM value, or undefined if not found
	 */
	SimpleFeature.prototype.getTag = function(key) {
		return (this._editedTags != null && this._editedTags[key] !== undefined) ?
			this._editedTags[key]
			: this._tags[key];
	};
	
	/**
	 * @return The name of the object, or its ID if it hasn't one
	 */
	SimpleFeature.prototype.getName = function() {
		var name = this._tags.name;
		return (name == undefined) ? this._id : name;
	};
	
	/**
	 * @return The center position
	 */
	SimpleFeature.prototype.getCenter = function() {
		return this._center;
	};
	
	/**
	 * Get the status of this feature, according to editable tags list
	 * @param editables The list of editable keys, as an array
	 * @return The completeness of the feature (full, partial, none)
	 */
	SimpleFeature.prototype.getStatus = function(editables) {
		var has = 0, l = editables.length;
		for(var i=0; i < l; i++) {
			if(this._tags[editables[i]] != undefined) { has++; }
		}
		
		return (has == 0) ? "none" : ((has == l) ? "full" : "partial");
	};
	
	/**
	 * @return True if edited by user
	 */
	SimpleFeature.prototype.isEdited = function() {
		return this._editedTags != null;
	};

//MODIFIERS
	/**
	 * Edit a given tag
	 * @param k The tag key
	 * @param v The tag value
	 */
	SimpleFeature.prototype.editTag = function(k, v) {
		if(this._editedTags == null) {
			this._editedTags = {};
		}
		
		this._editedTags[k] = v;
	};
