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

	Controllers, ie classes that manages the application.
*/

/***********************
 * NiuEdit object init *
 ***********************/

//Load config
var CONFIG;
$.ajax({
	url: 'config.json',
       async: false,
       dataType: 'json',
       success: function(data) { CONFIG = data; }
}).fail(function() { console.error("[Controller] Error while retrieving CONFIG"); });

//Load themes
var THEMES;
$.ajax({
	url: 'themes.json',
	async: false,
	dataType: 'json',
	success: function(data) { THEMES = data.themes; }
}).fail(function() { console.error("[Controller] Error while retrieving THEMES"); });

/**********************************************************************************/

/**
 * Controller for themes page (ie main page)
 */
ThemesController = function() {
//ATTRIBUTES
	/** The themes view **/
	this._view = new ThemesView(this);
};

/**********************************************************************************/

/**
 * Controller for map page
 */
MapController = function() {
//ATTRIBUTES
	/** The map view **/
	this._view = new MapView(this);
	
	/** The currently used theme **/
	this._theme = null;
	
	/** The OSM data **/
	this._data = null;

//CONSTRUCTOR
	//Get theme
	var themeId = this._view.getURLView().getTheme();
	if(themeId == -1) {
		alert("Invalid theme ID");
		window.location.replace("index.html");
	}
	else {
		this._theme = THEMES[themeId];
	}
	
	//Ajax errors handling
	$(document).ajaxError(function( event, jqxhr, settings, thrownError ) { console.log("Error: "+thrownError+"\nURL: "+settings.url); });
	
	this._view.init();
};

//ACCESSORS
	/**
	 * @return The currently used theme
	 */
	MapController.prototype.getTheme = function() {
		return this._theme;
	};
	
	/**
	 * @return The map view
	 */
	MapController.prototype.getView = function() {
		return this._view;
	};
	
	/**
	 * @return The OSM data
	 */
	MapController.prototype.getData = function() {
		return this._data;
	};

//OTHER METHODS

/*****************
 * Data download *
 *****************/
	/**
	 * Downloads data from Overpass API
	 * Then calls another function to process it.
	 * @param bbox The bounding box
	 */
	MapController.prototype.downloadData = function(bbox) {
		//Check if currently shown area is contained in previously downloaded data area
		//If not, download data
		if(this._data == null || !this._data.getBBox().contains(bbox)) {
			this._view.getLoadingView().setLoading(true);
			this._view.getLoadingView().addLoadingInfo("Request Overpass API");
			
			//Prepare request
			bbox = bbox.pad(0.6);
			var oapiRequest = new OapiQuery(this._theme.potential_objects).get(bbox);
			
			//Download data
			$.get(
				CONFIG.osm.oapi+encodeURIComponent(oapiRequest),
				function(data) { this.onDownloadSuccess(data, bbox) }.bind(this),
				"json"
			)
			.fail(this.onDownloadFail.bind(this));
		}
		else {
			this._view.getLMapView().doneChanging();
		}
	};
	
	/**
	 * This function is called when OSM data download is successful
	 */
	MapController.prototype.onDownloadSuccess = function(data, bbox) {
		this._view.getLoadingView().addLoadingInfo("Process received data");
		
		try {
			this._data = new OSMData(bbox, data);
			this._view.getLMapView().showData(this._data);
		}
		catch(e) {
			console.error(e);
			this._view.getMessagesView().display("error", "Data processing failed");
		}
		
		this._view.getLMapView().doneChanging();
		this._view.getLoadingView().setLoading(false);
	};
	
	/**
	 * This function is called when OSM data download fails
	 */
	MapController.prototype.onDownloadFail = function() {
		this._view.getLoadingView().setLoading(false);
		this._view.getLMapView().doneChanging();
		this._view.getMessagesView().display("error", "Data download failed");
	};

/*************
 * Data edit *
 *************/

	/**
	 * Start to edit the given feature
	 * If first feature edited, connect to OSM
	 */
	MapController.prototype.startEdit = function(id) {
		console.log("edit "+id);
		//TODO
	};