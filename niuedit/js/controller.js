/*
	This file is part of NiuEdit.

	NiuEdit is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	any later version.

	NiuEdit is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
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

NiuEdit = {};
NiuEdit.ctrl = {};

//Load themes
var THEMES;
$.ajax({
	url: 'themes.json',
	async: false,
	dataType: 'json',
	success: function(data) { THEMES = data; }
});

/***********
 * Classes *
 ***********/

/**
 * Controller for themes page (ie main page)
 */
NiuEdit.ctrl.ThemesController = function() {
//ATTRIBUTES
	/** The themes view **/
	var _view = null;

//CONSTRUCTOR
	this.init = function() {
		_view = new NiuEdit.view.ThemesView(this);
	};
};
