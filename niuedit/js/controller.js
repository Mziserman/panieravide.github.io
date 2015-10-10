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
	
	/** The authentication token **/
	this._auth = null;

//CONSTRUCTOR
	//Check if not logging in
	var urlParams = this._view.getURLView()._getParameters();
	if(urlParams.oauth_token != undefined) {
		this.doneLogin(urlParams.oauth_token);
	}
	else {
		this.initThemeView();
	}
	
	//Ajax errors handling
	$(document).ajaxError(function( event, jqxhr, settings, thrownError ) { console.log("Error: "+thrownError+"\nURL: "+settings.url); });
	
	//OSM Auth
	this._auth = osmAuth({
		oauth_consumer_key: CONFIG.osm.oauth.consumer_key,
		oauth_secret: CONFIG.osm.oauth.secret,
		auto: true,
		singlepage: true,
		landing: ''
	});
	
	//Update user name
	if(this.isAuthenticated()) {
		this.retrieveUserName();
	}
};

	MapController.prototype.initThemeView = function() {
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
	
	/**
	 * @return True if the user is authenticated
	 */
	MapController.prototype.isAuthenticated = function() {
		return this._auth != null && this._auth.authenticated();
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

/******************
 * Authentication *
 ******************/

	/**
	 * Authenticates the user
	 */
	MapController.prototype.login = function() {
		//Save current map params in a cookie (to restore after login)
		var map = this._view.getLMapView().get();
		Cookies.set('niuedit-lat', map.getCenter().lat);
		Cookies.set('niuedit-lon', map.getCenter().lng);
		Cookies.set('niuedit-zoom', map.getZoom());
		Cookies.set('niuedit-theme', this._view.getURLView().getTheme());
		
		//Authenticate
		if(!this._auth.authenticated()) {
			this._auth.authenticate();
		}
	};
	
	/**
	 * End user authentication
	 */
	MapController.prototype.doneLogin = function(oauth_token) {
		//Create auth object
		this._auth = osmAuth({
			oauth_consumer_key: CONFIG.osm.oauth.consumer_key,
			oauth_secret: CONFIG.osm.oauth.secret
		});
		
		//Set auth token
		this._auth.bootstrapToken(oauth_token, function() {
			//Check authentication
			if(this._auth.authenticated()) {
				this._view.getMessagesView().display("info", "Log-in succeed");
				this.retrieveUserName();
			}
			else {
				this._view.getMessagesView().display("error", "Authentication failed");
			}
			
			//Restore map state
			if(Cookies.get('niuedit-lat') != undefined && Cookies.get('niuedit-lon') != undefined && Cookies.get('niuedit-zoom') != undefined && Cookies.get('niuedit-theme') != undefined) {
				window.history.replaceState({}, "NiuEdit", $(location).attr('href').split('?')[0]+"?t="+Cookies.get('niuedit-theme')+"#"+Cookies.get('niuedit-zoom')+"/"+Cookies.get('niuedit-lat')+"/"+Cookies.get('niuedit-lon'));
				this.initThemeView();
			}
			else {
				alert("Can't reload previous map");
				window.location.replace("index.html");
			}
			
		}.bind(this));
	};
	
	/**
	 * Retrieve user name
	 */
	MapController.prototype.retrieveUserName = function() {
		if(this.isAuthenticated()) {
			this._auth.xhr({
				method: 'GET',
				path: '/api/0.6/user/details'
			}, function(err, res) {
				if(err) {
					this._view.setUser(null);
					this._view.getMessagesView().display("error", "Error when retrieving user data");
				}
				else {
					var userTag = res.getElementsByTagName('user')[0];
					this._view.setUser(userTag.getAttribute('display_name'));
				}
			}.bind(this));
		}
	};
	
	/**
	 * Logs out the user
	 */
	MapController.prototype.logOut = function() {
		if(this._auth != null) {
			this._auth.logout();
		}
		this._view.getMessagesView().display("info", "Successfully logged out");
		this._view.setUser(null);
	};

/*************
 * Data edit *
 *************/

	/**
	 * Start to edit the given feature
	 * If first feature edited, connect to OSM
	 */
	MapController.prototype.startEdit = function(id) {
		//If not authenticated, show auth dialog
		if(this._auth == null || !this._auth.authenticated()) {
			this._view.getAccountView().show();
		}
		//If authenticated, start edit
		else {
			this._view.getObjectEditView().show(id);
		}
	};