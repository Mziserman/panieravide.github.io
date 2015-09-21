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
	
	/** The account view **/
	this._vAccount = new AccountView(this);
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
		
		//Add help button click handler
		$("#btn-help").click(function() { $("#modal-help").modal("show"); });
		
		//Set logged text
		this.setUser(null);
		
		//Log out button
		$("#btn-logout").click(function() { this._ctrl.logOut(); }.bind(this));
		
		this._vOptions.init();
	};
	
//ACCESSORS
	/**
	 * @return The controller
	 */
	MapView.prototype.getController = function() {
		return this._ctrl;
	};
	
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
	
	/**
	 * @return The options view
	 */
	MapView.prototype.getOptionsView = function() {
		return this._vOptions;
	};
	
	/**
	 * @return The account view
	 */
	MapView.prototype.getAccountView = function() {
		return this._vAccount;
	};
	
	/**
	 * @return The leaflet map view
	 */
	MapView.prototype.getLMapView = function() {
		return this._vMap;
	};

//MODIFIERS
	/**
	 * Sets the logged user name
	 * @param user The user name, or null to unset
	 */
	MapView.prototype.setUser = function(user) {
		if(user != null) {
			$("#logged-text").show();
			$("#logged-text span").html(user);
			$("#btn-logout").show();
		}
		else {
			$("#logged-text").hide();
			$("#btn-logout").hide();
		}
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
	
	/** The layer containing the shown data **/
	this._dataLayer = L.layerGroup().addTo(this._map);

//CONSTRUCTOR
	//Tiles
	L.tileLayer(CONFIG.map.tiles.URL, {
		attribution: CONFIG.map.tiles.attribution,
		minZoom: CONFIG.map.tiles.minZoom,
		maxZoom: CONFIG.map.tiles.maxZoom
	}).addTo(this._map);
	
	//Hash
	new L.Hash(this._map);
	
	//Events
	this._map.on("moveend resize", this.moved.bind(this));
	this._map.on("zoomend", this.zoomed.bind(this));
	
	//First call for data download
	this.requestData(true);
};

//ACCESSORS
	/**
	 * @return The leaflet map
	 */
	LMapView.prototype.get = function() {
		return this._map;
	};
	
//MODIFIERS
	/**
	 * Set changing state as false
	 */
	LMapView.prototype.doneChanging = function() {
		this._isChanging = false;
	};
	
	/**
	 * Displays the given OSM data on map
	 * @param data The OSM data object
	 */
	LMapView.prototype.showData = function(data) {
		//Clear data layer
		this._dataLayer.clearLayers();
		
		//Get editable tags list
		var editTags = this._mainView.getController().getTheme().editable_tags;
		var editKeys = [];
		for(var i=0; i < editTags.length; i++) {
			editKeys.push(editTags[i].key);
		}
		
		var features = data.getFeatures();
		var nbFeatures = 0;
		var theme = this._mainView.getController().getTheme();
		
		//Read features
		var feature, marker, text;
		for(var fId in features) {
			feature = features[fId];
			
			if(this._showFeature(feature)) {
				status = feature.getStatus(editKeys);
				
				//Create marker
				switch(status) {
					case "none":
						marker = L.circleMarker(feature.getCenter(), { color: "gray", fillColor: "white", opacity: 0.9, fillOpacity: 0.6, weight: 8, radius: 15 });
						break;
					case "partial":
						marker = L.circleMarker(feature.getCenter(), { color: "orange", fillColor: "white", opacity: 0.9, fillOpacity: 0.6, weight: 8, radius: 15 });
						break;
					case "full":
						marker = L.circleMarker(feature.getCenter(), { color: "green", fillColor: "white", opacity: 0.9, fillOpacity: 0.6, weight: 8, radius: 15 });
						break;
				}
				
				//Add popup
				text = '<div class="popup-header"><span class="title">'+feature.getName()+'</span>';
				
				//Links
				text += ' <a class="link" onclick="ctrl.startEdit(\''+feature.getId()+'\')"><img src="img/icon_edit.svg" alt="Edit" /></a>';
				text += ' <a class="link" href="http://openstreetmap.org/'+feature.getId()+'" target="_blank"><img src="img/icon_osm.svg" alt="OSM.org" /></a></div>';
				
				//Table
				text += '<table class="table popup"><thead><tr><th>Description</th><th>Value</th></tr></thead>';
				text += '<tbody>';
				
				var tag, editTag, valDesc;
				for(var i=0; i < editTags.length; i++) {
					editTag = editTags[i];
					tag = feature.getTag(editTag.key);
					
					if(tag != undefined) {
						switch(editTag.values.type) {
							case "list":
								valDesc = editTag.values.list[tag];
								break;
							case "int":
							case "float":
							default:
								valDesc = tag;
								break;
						}
						text += '<tr><td>'+editTag.description+'</td><td>'+valDesc+'</td></tr>';
					}
					else {
						text += '<tr><td>'+editTag.description+'</td><td>Undefined</td></tr>';
					}
				}
				
				text += '</tbody></table>';
				
				marker.bindPopup(L.popup({ minWidth: 250, maxWidth: 500 }).setContent(text));
				
				//Add to data layer
				this._dataLayer.addLayer(marker);
				nbFeatures++;
			}
		}
		
		if(nbFeatures == 0) {
			this._mainView.getMessagesView().display("alert", "No available data here");
		}
	};
	
//OTHER METHODS
	/**
	 * Asks for data when map moves or zoom changes
	 * @param alert Alert user when zoom is too low ?
	 */
	LMapView.prototype.requestData = function(alert) {
		if(!this._isChanging) {
			this._isChanging = true;
			
			//Is map at the correct zoom ?
			if(this._map.getZoom() >= CONFIG.data_view.minZoom) {
				this._mainView.getController().downloadData(this._map.getBounds());
			}
			else {
				this._isChanging = false;
				if(alert) {
					this._mainView.getMessagesView().display("info", "Zoom in to see data");
				}
			}
		}
	};
	
	/**
	 * Must we show the given feature, according to options ?
	 */
	LMapView.prototype._showFeature = function(f) {
		var options = this._mainView.getOptionsView();
		
		//If filter panel is hidden, we show all features
		if(!options.isActive()) { return true; }
		
		//Else, look at the filter
		var theme = this._mainView.getController().getTheme();
		var key = options.getFilterKey();
		
		if(key == "none") { return true; }
		
		if(options.isNumericFilter()) {
			var value = parseFloat(f.getTag(key));
			
			//If value is invalid, stop
			if(isNaN(value)) { return false; }
			else {
				return value >= options.getSliderMin() && value <= options.getSliderMax();
			}
		}
		else {
			return options.isChecked(f.getTag(key));
		}
	};
	
	/**
	 * This method is called when map moves
	 * Checks for zoom level and query data if needed
	 */
	LMapView.prototype.moved = function() {
		this.requestData(false);
	};
	
	/**
	 * This method is called when map zoom changes
	 * Checks for zoom level and query data if needed
	 */
	LMapView.prototype.zoomed = function() {
		this.requestData(true);
	};
	
	/**
	 * This method is called when options change
	 */
	LMapView.prototype.optionsChanged = function() {
		this.showData(this._mainView.getController().getData());
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
	
	/** The slider for values filter **/
	this._slider = null;
	
	/** The timer for map update **/
	this._timer = null;
	
	/** The delay to trigger map update **/
	this._delay = 200;
	
//CONSTRUCTOR
	$("#btn-options").click(this.toggle.bind(this));
	$("#inputFilterKey").change(this.keyChanged.bind(this));
};

	OptionsView.prototype.init = function() {
		var theme = this._mainView.getController().getTheme();
		
		//Clear the key selector
		var dom = $("#inputFilterKey");
		dom.empty();
		var filterHtml = '<option value="none">No filter</option>';
		
		//Add editable keys
		for(var i=0; i < theme.editable_tags.length; i++) {
			filterHtml += '<option value="'+theme.editable_tags[i].key+'">'+theme.editable_tags[i].description+'</option>';
		}
		
		dom.html(filterHtml);
		
		//Hide filter values
		$("#filter-values").addClass("hidden");
	};

//ACCESSORS
	/**
	 * @return True if numeric value based filter
	 */
	OptionsView.prototype.isNumericFilter = function() {
		return this._slider != null;
	};
	
	/**
	 * @return The minimal value of the slider
	 */
	OptionsView.prototype.getSliderMin = function() {
		return (this._slider != null) ? this._slider.noUiSlider.get()[0] : null;
	};
	
	/**
	 * @return The maximal value of the slider
	 */
	OptionsView.prototype.getSliderMax = function() {
		return (this._slider != null) ? this._slider.noUiSlider.get()[1] : null;
	};
	
	/**
	 * @return True if some options are appliable
	 */
	OptionsView.prototype.isActive = function() {
		return !this._dom.hasClass("hide") || $("#inputFilterKey").val() != "none";
	};
	
	/**
	 * @return The filter key
	 */
	OptionsView.prototype.getFilterKey = function() {
		return $("#inputFilterKey").val();
	};
	
	/**
	 * Is the checkbox for the given value checked ?
	 */
	OptionsView.prototype.isChecked = function(val) {
		if(val == undefined) { val = "undefined"; }
		var dom = $("#val-"+val);
		return dom.length > 0 && dom.is(":checked");
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
	
	/**
	 * This method is called when the filter key selector value changes
	 */
	OptionsView.prototype.keyChanged = function() {
		var theme = this._mainView.getController().getTheme();
		
		//Show or hide values
		var key = $("#inputFilterKey").val();
		if(key == "none") {
			$("#filter-values").addClass("hidden");
		}
		else {
			$("#filter-values").removeClass("hidden");
			
			//Find key in theme
			var found = false, i=0;
			while(!found && i < theme.editable_tags.length) {
				if(theme.editable_tags[i].key == key) {
					found = true;
				}
				else {
					i++;
				}
			}
			
			//Create value filters
			if(found) {
				var dom = $("#filter-values-selectors");
				dom.empty();
				var valuesHtml = '';
				
				var valuesDef = theme.editable_tags[i].values;
				var valuesType = valuesDef.type;
				
				if(valuesType == "list") {
					//Checkbox to add events to
					var cb = [];
					//Create checkbox for each value in list
					for(var i in valuesDef.list) {
						valuesHtml += '<label class="checkbox-inline"><input type="checkbox" id="val-'+i+'" checked> '+valuesDef.list[i]+'</label>';
						cb.push("#val-"+i);
					}
					valuesHtml += '<label class="checkbox-inline"><input type="checkbox" id="val-undefined" checked> Undefined</label>';
					cb.push("#val-undefined");
					
					dom.html(valuesHtml);
					
					for(var i=0; i < cb.length; i++) {
						$(cb[i]).off();
						$(cb[i]).change(this._notifyMap.bind(this));
					}
					
					this._slider = null;
				}
				else if(valuesType == "int") {
					//Create slider HTML
					valuesHtml = '<div id="slider"></div>From <span class="example-val" id="slider-value-lower"></span> to <span class="example-val" id="slider-value-upper"></span>';
					dom.html(valuesHtml);
					
					//Create slider JS
					this._slider = document.getElementById('slider');
					noUiSlider.create(this._slider, {
						start: [ valuesDef.min, valuesDef.max ],
		       step: 1,
		       connect: true,
		       range: {
			       'min': valuesDef.min,
		       'max': valuesDef.max
		       }
					});
					//Values update
					var sliderVals = [
					document.getElementById('slider-value-lower'),
					document.getElementById('slider-value-upper')
					];
					this._slider.noUiSlider.on('update', function(values, handle) {
						sliderVals[handle].innerHTML = Math.round(values[handle]);
						this._notifyMap();
					}.bind(this));
				}
				else if(valuesType == "float") {
					//Create slider HTML
					valuesHtml = '<div id="slider"></div>From <span id="slider-value-lower"></span> to <span id="slider-value-upper"></span>';
					dom.html(valuesHtml);
					
					//Create slider JS
					this._slider = document.getElementById('slider');
					noUiSlider.create(this._slider, {
						start: [ valuesDef.min, valuesDef.max ],
		       step: 0.1,
		       connect: true,
		       range: {
			       'min': valuesDef.min,
		       'max': valuesDef.max
		       }
					});
					//Values update
					var sliderVals = [
					document.getElementById('slider-value-lower'),
					document.getElementById('slider-value-upper')
					];
					this._slider.noUiSlider.on('update', function(values, handle) {
						sliderVals[handle].innerHTML = values[handle];
						this._notifyMap();
					}.bind(this));
				}
				else {
					console.error("Unsupported values type: "+valuesType);
				}
			}
			else {
				console.error("Key not found in theme: "+key);
			}
		}
		
		this._notifyMap();
	};
	
	/**
	 * Notify map that options changed, after a delay
	 */
	OptionsView.prototype._notifyMap = function() {
		window.clearTimeout(this._timer);
		this._timer = window.setTimeout(
			function() {
				this._mainView.getLMapView().optionsChanged();
			}.bind(this),
			this._delay
		);
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
	 * @return The full parameters (params + hash) of the page
	 */
	URLView.prototype.getFullParams = function() {
		return $(location).attr('href').split('?')[1];
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
			$("#loading-info").empty();
			this._dom.modal({ keyboard: false, backdrop: 'static' });
			this._lastTime = (new Date()).getTime();
		}
		else {
			this._dom.modal("hide");
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

//CONSTRUCTOR
	//PNotify init
	PNotify.prototype.options.styling = "bootstrap3";
	PNotify.prototype.options.delay = 400;
};

//MODIFIERS
	/**
	 * Shows a message to the user
	 * @param level The kind of message (info, alert, error)
	 * @param title The message title
	 * @param msg The message to show
	 */
	MessagesView.prototype.display = function(level, msg, title) {
		//Create title if undefined
		if(!title) {
			switch(level) {
				case "alert":
					title = "Warning";
					break;
				case "info":
					title = "Info";
					break;
				case "error":
					title = "Error";
					break;
			}
		}
		
		if(level == "alert") { level = undefined; }
		
		//Create notification
		new PNotify({
			title: title,
			text: msg,
			type: level
		});
	};

/**********************************************************************************/
	
/**
 * The loading overlay panel component
 */
AccountView = function(main) {
//ATTRIBUTES
	/** The main view **/
	this._mainView = main;
	
	/** The DOM object **/
	this._dom = $("#modal-account");

//CONSTRUCTOR
	$("#button-login").click(this._mainView.getController().login.bind(this._mainView.getController()));
};

//MODIFIERS
	AccountView.prototype.show = function() {
		this._dom.modal("show");
	};
