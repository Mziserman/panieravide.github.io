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
	//Query start
	this._query = '[out:json][timeout:25];(';
	
	//Query content
	var txt, potential, val, valSplit;
	for(var i=0; l=potentials.length; i < l; i++) {
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
	this._query += ');out meta center;';
};

//ACCESSORS
	/**
	 * @param bbox The leaflet BBox object
	 * @return The query string for OAPI request
	 */
	OapiQuery.prototype.get(bbox) {
		
	};
