const sortKeys : any = require('sort-keys');

export class Utility
{
	public static sortedJson(obj : any) : string
	{
		//Convert the input argument to a plain object
		let plainObj = JSON.parse(JSON.stringify(obj));
		
		//If the object is an array, sort it recursively
		let sorted : any = null;
		if (Array.isArray(plainObj) === true) {
			sorted = plainObj.map((obj : any) => { return sortKeys(obj, true); });
		}
		else {
			sorted = sortKeys(plainObj, true);
		}
		
		//Serialise the sorted object
		return JSON.stringify(sorted);
	}
}
