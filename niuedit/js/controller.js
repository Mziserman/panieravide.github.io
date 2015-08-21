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

//Load themes
var THEMES;
$.ajax({
	url: 'themes.json',
	async: false,
	dataType: 'json',
	success: function(data) { THEMES = data.themes; }
});

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
	
	this._view.init();
};

//ACCESSORS
	/**
	 * @return The currently used theme
	 */
	MapController.prototype.getTheme = function() {
		return this._theme;
	};

//OTHER METHODS

/*******************
 * Data management *
 *******************/
	/**
	 * Downloads data from Overpass API
	 * Then calls another function to process it.
	 * @param bbox The bounding box
	 */
	MapController.prototype.downloadData = function(bbox) {
		var oapiRequest = null;
		//var bounds = boundsString(bbox);
		
		this._view.getLoadingView().setLoading(true);
		this._view.getLoadingView().addLoadingInfo("Request Overpass API");
		
		//Prepare request
		//oapiRequest = '[out:json][timeout:25][bbox:'+bounds+'];(node["repeat_on"];way["repeat_on"];relation["repeat_on"];node[~"^.*level$"~"."];way[~"^.*level$"~"."];relation[~"^.*level$"~"."];);out body;>;out qt skel;';

		//Download data
		/*$(document).ajaxError(function( event, jqxhr, settings, thrownError ) { console.log("Error: "+thrownError+"\nURL: "+settings.url); });
		$.get(
			CONFIG.osm.oapi+encodeURIComponent(oapiRequest),
			this.onDownloadSuccess.bind(this),
			"json")
		.fail(controller.onDownloadFail.bind(this));*/
	};
	
	/**
	 * This function is called when OSM data download is successful
	 */
	MapController.prototype.onDownloadSuccess = function(data) {
		this._view.getLoadingView().addLoadingInfo("Process received data");
		this._data = new OSMData(bbox, data);
		
		//TODO
		
		this._view.getLoadingView().setLoading(false);
	};
	
	/**
	 * This function is called when OSM data download fails
	 */
	MapController.prototype.onDownloadFail = function() {
		this._view.getLoadingView().setLoading(false);
		this._view.getMessagesView().displayMessage("An error occured during data download", "error");
	};