const sortKeys : any = require('sort-keys');

export class Utility
{
	//Expands our custom regex tokens into the correct escape sequences for a single pattern
	public static expandRegex(pattern : string)
	{
		pattern = pattern.replace(/\{a-int\}/g,     '{any}{int}')                  //Any character and then capture a single integer value
		pattern = pattern.replace(/\{a-float\}/g,   '{any}{float}')                //Any character and then capture a single float value
		pattern = pattern.replace(/\{any\}/g,       '[\\s\\S]*?')                  //Any character, including newlines (non-greedy)
		pattern = pattern.replace(/\{int\}/g,       '(\\-*[0-9]+)')                //Capture a single integer value
		pattern = pattern.replace(/\{float\}/g,     '(\\-*[0-9]+(?:\\.[0-9]+)*)')  //Capture a single float value
		pattern = pattern.replace(/\{dollar\}/g,    '\\$')                         //A dollar sign
		pattern = pattern.replace(/\{caret\}/g,     '\\^')                         //A caret symbol
		pattern = pattern.replace(/\{asterisk\}/g,  '\\*')                         //An asterisk
		pattern = pattern.replace(/\{question\}/g,  '\\?')                         //A question mark
		pattern = pattern.replace(/\{plus\}/g,      '\\+')                         //A plus sign
		pattern = pattern.replace(/\{minus\}/g,     '\\-')                         //A minus sign
		pattern = pattern.replace(/\{period\}/g,    '\\.')                         //A period
		pattern = pattern.replace(/\{lparen\}/g,    '\\(')                         //A left paren
		pattern = pattern.replace(/\{rparen\}/g,    '\\)')                         //A right paren
		pattern = pattern.replace(/\{lbrace\}/g,    '\{')                          //A left curly brace
		pattern = pattern.replace(/\{rbrace\}/g,    '\}')                          //A right curly brace
		pattern = pattern.replace(/\{lbracket\}/g,  '\\[')                         //A left square bracket
		pattern = pattern.replace(/\{rbracket\}/g,  '\\]')                         //A right square bracket
		pattern = pattern.replace(/\{pipe\}/g,      '\\|')                         //A pipe / vertical bar symbol
		pattern = pattern.replace(/\{backslash\}/g, '\\\\')                        //A backslash
		return pattern;
	}
	
	//Expands custom regex tokens for a list of regexes
	public static expandRegexes(patterns : string[]) {
		return patterns.map(Utility.expandRegex);
	}
	
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
