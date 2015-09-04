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

	View classes, managing the web pages.
*/

/**
 * This class handles the main page themes list
 */
ThemesView = function(ctrl) {
//ATTRIBUTES

//CONSTRUCTOR
	//Init events
	$("#link-about").click(function() { $("#modal-about").modal("show"); });
	
	//Load themes
	this.load();
};

//OTHER METHODS
	/**
	 * Loads the themes
	 */
	ThemesView.prototype.load = function() {
		var themesHtml = '', theme;
		
		//Read each theme
		for(var i=0, l=THEMES.length; i < l; i++) {
			theme = THEMES[i];
			themesHtml += '<div class="col-xs-12 col-sm-6 col-md-4 col-lg-3">'
							+ '<a href="map.html?t='+i+'" class="theme" title="Start mapping '+theme.title+' theme"'
							+ ' style="background-color: '+theme.style.background+'; color: '+theme.style.text+'">'
							+ '<span class="icon"><img src="img/themes_icons/'+theme.style.icon+'" /></span>'
							+ '<span class="name">'+theme.title+'</span>'
							+ '<span class="description">'+theme.subtitle+'</span>'
							+ '</a>'
							+ '</div>';
		}
		
		//Update page
		$("#themes").html(themesHtml);
	};

/**********************************************************************************/

/**
 * MapView, the main view of map page
 * It doesn't handle directly the leaflet map, see LMapView for that
 */
MapView = function(ctrl) {
//ATTRIBUTES
	/** The MapController **/
	this._ctrl = ctrl;
	
	/** The messages view **/
	this._vMessages = new MessagesView(this);
	
	/** The LMapView **/
	this._vMap = new LMapView(this);
	
	/** The options view **/
	this._vOptions = new OptionsView(this);
	
	/** The URL view **/
	this._vURL = new URLView(this);
	
	/** The loading view **/
	this._vLoading = new LoadingView(this);
};

//CONSTRUCTOR
	/**
	 * This should be called to display correct theme
	 */
	MapView.prototype.init = function() {
		var theme = this._ctrl.getTheme();
		
		//Change page title
		document.title = theme.title+' - '+document.title;
		
		//Change header
		var title = $("#theme-title");
		title.html(theme.title);
		title.css("background-color", theme.style.background);
		title.css("color", theme.style.text);
	};
	
//ACCESSORS
	/**
	 * @return The URL view
	 */
	MapView.prototype.getURLView = function() {
		return this._vURL;
	};
	
	/**
	 * @return The loading view
	 */
	MapView.prototype.getLoadingView = function() {
		return this._vLoading;
	};
	
	/**
	 * @return The messages view
	 */
	MapView.prototype.getMessagesView = function() {
		return this._vMessages;
	};

/**********************************************************************************/

/**
 * The leaflet map view
 */
LMapView = function(main) {
//ATTRIBUTES
	/** The MapView **/
	this._mainView = main;
	
	/** The leaflet map object **/
	this._map = L.map('map').setView([CONFIG.map.position.lat, CONFIG.map.position.lon], CONFIG.map.position.zoom);
	
	/** Is the map already handling a change event **/
	this._isChanging = false;

//CONSTRUCTOR
	//Tiles
	L.tileLayer(CONFIG.map.tiles.URL, {
		attribution: CONFIG.map.tiles.attribution,
		minZoom: CONFIG.map.tiles.minZoom,
		maxZoom: CONFIG.map.tiles.maxZoom
	}).addTo(this._map);
	
	//Events
	this._map.on("moveend resize", this.moved.bind(this));
	this._map.on("zoomend", this.zoomed.bind(this));
	
	//First call for data download
	this.moved();
};

//OTHER METHODS
	/**
	 * This method is called when map moves
	 * Checks for zoom level and query data if needed
	 */
	LMapView.prototype.moved = function() {
		if(!this._isChanging) {
			this._isChanging = true;
			
			//Is map at the correct zoom ?
			if(this._map.getZoom() >= CONFIG.data_view.minZoom) {
				//TODO
				console.log("download");
			}
			else {
				this._isChanging = false;
			}
		}
	};
	
	/**
	 * This method is called when map zoom changes
	 * Checks for zoom level and query data if needed
	 */
	LMapView.prototype.zoomed = function() {
		if(!this._isChanging) {
			this._isChanging = true;
			
			//Is map at the correct zoom ?
			if(this._map.getZoom() >= CONFIG.data_view.minZoom) {
				//TODO
				console.log("download");
			}
			else {
				this._isChanging = false;
				this._mainView.getMessagesView().display("info", "Zoom in to see data");
			}
		}
	};

/**********************************************************************************/

/**
 * The options view, to filter the object shown on map
 */
OptionsView = function(main) {
//ATTRIBUTES
	/** The map view **/
	this._mainView = main;

	/** The options DOM object **/
	this._dom = $("#options");
	
//CONSTRUCTOR
	$("#btn-options").click(this.toggle.bind(this));
};

//OTHER METHODS
	/**
	 * Toggles the view
	 */
	OptionsView.prototype.toggle = function() {
		if(this._dom.hasClass("hide")) {
			this._dom.removeClass("hide");
		}
		else {
			this._dom.addClass("hide");
		}
	};

/**********************************************************************************/

/**
 * The URL view
 */
URLView = function(main) {
//ATTRIBUTES
};

//ACCESSORS
	/**
	 * @return The theme ID, or -1 if undefined
	 */
	URLView.prototype.getTheme = function() {
		var result = -1;
		var themeStr = this._getParameters().t;
		
		if(themeStr != undefined) {
			var themeInt = parseInt(themeStr);
			if(!isNaN(themeInt) && themeInt >= 0) {
				result = themeInt;
			}
		}
		
		return result;
	};
	
//OTHER METHODS
	/**
	 * @return The page base URL
	 */
	URLView.prototype._getUrl = function() {
		return $(location).attr('href').split('?')[0];
	};
	
	/**
	 * @return The URL hash
	 */
	URLView.prototype._getUrlHash = function() {
		var hash = $(location).attr('href').split('#')[1];
		return (hash != undefined) ? hash : "";
	};
	
	/**
	 * Get URL parameters
	 * @return The parameters
	 */
	URLView.prototype._getParameters = function() {
		var sPageURL = window.location.search.substring(1);
		var sURLVariables = sPageURL.split('&');
		var params = new Object();
		
		for (var i = 0; i < sURLVariables.length; i++) {
			var sParameterName = sURLVariables[i].split('=');
			params[sParameterName[0]] = sParameterName[1];
		}
		
		return params;
	};

/**********************************************************************************/

/**
 * The loading overlay panel component
 */
LoadingView = function() {
//ATTRIBUTES
	/** Is loading ? **/
	this._loading = false;
	
	/** The last timestamp **/
	this._lastTime = 0;
	
	/** The DOM object **/
	this._dom = $("#modal-loading");
};
	
//ACCESSORS
	/**
	 * @return True if loading
	 */
	LoadingView.prototype.isLoading = function() {
		return this._loading;
	};
	
//OTHER METHODS
	/**
	 * Shows or hides the loading component
	 * @param loading True if the application is loading something
	 */
	LoadingView.prototype.setLoading = function(loading) {
		this._loading = loading;
		if(loading) {
			this._dom.modal({ keyboard: false, backdrop: 'static' });
			this._lastTime = (new Date()).getTime();
		}
		else {
			this._dom.modal("hide");
			//$(document).trigger("loading_done");
		}
	};
	
	/**
	 * Adds an information about the loading progress
	 * @param info The loading information to add
	 */
	LoadingView.prototype.addLoadingInfo = function(info) {
		//Timestamp
		var currentTime = (new Date()).getTime();
		$("#loading-info li:last").append(' <small>'+(currentTime-this._lastTime)+' ms</small>');
		
		//Add a new child in list, corresponding to the given message
		var newLi = document.createElement("li");
		$("#loading-info").append(newLi);
		
		//Add text to the added child
		$("#loading-info li:last-child").html(info);
		
		this._lastTime = currentTime;
	};

/**********************************************************************************/

/**
 * The messages view, alerting user about events
 */
MessagesView = function(main) {
//ATTRIBUTES
	/** The main view **/
	this._mainView = main;
};

//MODIFIERS
	/**
	 * Shows a message to the user
	 * @param level The kind of message (info, alert, error)
	 * @param msg The message to show
	 */
	MessagesView.prototype.display = function(level, msg) {
		alert(level+": "+msg);
	};