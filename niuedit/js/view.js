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

	View classes, managing the web pages.
*/

/*********************
 * NiuEdit view init *
 *********************/

NiuEdit.view = {};


/***********
 * Classes *
 ***********/

NiuEdit.view.ThemesView = function(_ctrl) {
//ATTRIBUTES

//CONSTRUCTOR
	function _init() {
		//Init events
		$("#link-about").click(function() { $("#modal-about").modal("show"); });
	};

}