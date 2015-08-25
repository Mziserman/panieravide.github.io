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

	Utility methods
*/

/**
 * @param val The latitude
 * @return The normalized latitude (between -90 and 90)
 */
function normLat(val) {
	return (val % 90 == 0 && val != 0) ? ((val < 0) ? -90 : 90) : normAbs(val, 90);
}

/**
 * @param val The longitude
 * @return The normalized longitude (between -180 and 180)
 */
function normLon(val) {
	return (val % 180 == 0 && val != 0) ? ((val < 0) ? -180 : 180) : normAbs(val, 180);
}

/**
 * @return The normalized absolute value
 */
function normAbs(val, mod) {
	while(val < -mod) { val += 2*mod; }
	while(val > mod) { val -= 2*mod; }
	var neg = val < 0;
	val = Math.abs(val) % mod;
	return (neg) ? -val : val;
}