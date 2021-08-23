/**
 * Formats a string in a uniform format
 *
 * @method formatName
 * @param  {string} str String to be formatted
 * @return {String} Formatted String
 */
export const formatName = (str) => `${str}`.toLowerCase();

/**
 * Checks a map for an existing key
 * If it doesn't exist, it sets it to the return of the value callback function
 *
 * @method initializeIfNeeded
 * @param  {Map} map Map to be searched
 * @param  {String} name Key to use for search
 * @param  {function} [value] Callback used to generate value if key is missing
 * @return {any} Value of name key in map
 */
export const initializeIfNeeded = (map, name, value = () => new Map()) => {
	if (!map.has(name)) map.set(name, value());
	return map.get(name);
};

