/*
 * This file is part of YoHours.
 * 
 * YoHours is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 * 
 * YoHours is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with YoHours.  If not, see <http://www.gnu.org/licenses/>.
 */

/*
 * YoHours
 * Web interface to make opening hours data for OpenStreetMap the easy way
 * Author: Adrien PAVIE
 *
 * Controller JS classes
 */
YoHours.ctrl = {
/*
 * ========= CONSTANTS =========
 */

/*
 * ========== CLASSES ==========
 */
MainController: function() {
//ATTRIBUTES
	/** Main view object **/
	var _view = new YoHours.view.MainView(this);

	/** The typical week **/
	var _week = new YoHours.model.Week();
	
	/** The opening hours parser **/
	var _parser = new YoHours.model.OpeningHoursParser();

	/** This object **/
	var _self = this;

//ACCESSORS
	/**
	 * @return The current week
	 */
	this.getWeek = function() {
		return _week;
	}
	
	/**
	 * @return The opening_hours value
	 */
	this.getOpeningHours = function() {
		return _parser.parse(_week);
	};

//OTHER METHODS
	/**
	 * Initializes the controller
	 */
	this.init = function() {
		_view.init();
	}

	/**
	 * Event handler, to add the current interval in week
	 */
	this.newInterval = function() {
		var intervalId = _week.addInterval(_view.getCurrentInterval());
		_view.addInterval(intervalId, _week);
		_view.refresh();
	};
	
	/**
	 * Event handler, to remove the given interval from week
	 * @param intervalId The interval ID
	 */
	this.removeInterval = function(intervalId) {
		_week.removeInterval(intervalId);
		_view.refresh();
		console.log(_week.getIntervals());
	};
}

};