const doubleMeta = require('double-metaphone');
//const stemmer = require('stemmer');
const Enmap = require("enmap");

const wordlist = require('./wordlist.json') // will be received from server in actual implementation, assume filter strictness-specific list is sent
											// also assume list is regular text; human-readable text much easier to edit

// assume input text format is 'userID : message\n'
// e.g.
// 103945 : hello
// 103953 : leave immediately

const wordlistMap = new Enmap();
wordlist.bannedlist.map((word) => {
	let metaResult = doubleMeta(word);
	wordlistMap.set(word, true);
	wordlistMap.set(metaResult[0], true);
	if (metaResult[0] !== metaResult[1]) {
		wordlistMap.set(metaResult[1], true);
	}
});

/*
	convert special char to reg:
	0->o
	1->i and l
	3->e
	4->a
	5->s
	6->b
	7->t
	8->b
	13 -> b
	i3 -> b
	l3 -> b
	!3 -> b
	+->t
	!->i and l
	@ -> g/a
	$ -> s
	l -> i
*/
// inputString assumed to be lowercase, idx starts at 0
// returns array of possible aliases
function convertToAlpha(inputStr, idx) {
	let wordArr = [];
	if (idx === inputStr.length) {
		wordArr.push(inputStr);
		return wordArr;
	}

	let replaceCharArr = [];
	switch(inputStr[idx]) {
		case '0':
			replaceCharArr.push(['o',1]);
			break;	
		case '1':
			replaceCharArr.push(['i',1]);
			replaceCharArr.push(['l',1]);
			if (inputStr[idx+1] === '3') {
				replaceCharArr.push(['b',2]);
			}
			break;
		case '3':
			replaceCharArr.push(['e',1]);
			break;
		case '4':
			replaceCharArr.push(['a',1]);
			break;
		case '5':
			replaceCharArr.push(['s',1]);
			break;
		case '6':
			replaceCharArr.push(['b',1]);
			break;
		case '7':
			replaceCharArr.push(['t',1]);
			break;
		case '8':
			replaceCharArr.push(['b',1]);
			break;
		case '+':
			replaceCharArr.push(['t',1]);
			break;
		case '!':
			replaceCharArr.push(['i',1]);
			replaceCharArr.push(['l',1]);
			if (inputStr[idx+1] === '3') {
				replaceCharArr.push(['b',2]);
			}
			break;
		case '@':
			replaceCharArr.push(['g',1]);
			replaceCharArr.push(['a',1]);
			break; 
		case '$':
			replaceCharArr.push(['s',1]);
			break;
		case 'l':
			replaceCharArr.push(['i',1]);
			replaceCharArr.push(['l',1]);
			if (inputStr[idx+1] === '3') {
				replaceCharArr.push(['b',2]);
			}
			break;
		case 'i':
			replaceCharArr.push(['l',1]);
			replaceCharArr.push(['i',1]);
			if (inputStr[idx+1] === '3') {
				replaceCharArr.push(['b',2]);
			}
			break;
		default:
			let currentChar = inputStr[idx];
			replaceCharArr.push([currentChar,1]);
			break;
	}
	let numReplacements = replaceCharArr.length;
	let offset = 0;
	for (var i = 0; i < numReplacements; i++) {
		offset = idx+replaceCharArr[i][1];
		wordArr = wordArr.concat(convertToAlpha(inputStr.slice(0,idx)+replaceCharArr[i][0]+inputStr.slice(offset), offset));
	}
	return wordArr;
}

// TODO: change console.log to text logs
function isBannedWord(wordArr) {
	for (var i = 0; i < wordArr.length; i++) {
		let word = wordArr[i];
		let metaInputResult = doubleMeta(word);
		if (wordlistMap.has(word)) {
			//console.log("banned 0: " + word);
			return true;
		} else if (wordlistMap.has(metaInputResult[0])) {
			//console.log("banned 1: " + word);
			return true;
		} else if (wordlistMap.has(metaInputResult[1])) {
			//console.log("banned 2: " + word);
			return true;
		} else {
			//console.log("pass: " + word);
		}
	}
	return false;
}

const Discord = require("discord.js");

exports.filter = (message, inputStr) => {
	let wordArr = convertToAlpha(inputStr.toLowerCase(), 0);
	message.channel.send(wordArr);

	if (isBannedWord(wordArr)) {
		message.channel.send("banned");
	} else {
		message.channel.send("pass");
	}
};


// local testing, write to log
/*
var stdin = process.openStdin();
stdin.addListener("data", function(d) {
	// preprocessing
	let str = d.toString().toLowerCase();

	//only allow proper chars (regexp), convert accent chars to reg


	//doublemeta search only for space separated words
	//substring search must be for >length 2, <max length bad word, and must contain at least one vowel. also only check with literals




	//remove ok words before condensing
	//remove spaces, replace repeats longer than double? with single char, search for substrings

	let wordArr = convertToAlpha(d.toString().toLowerCase(), 0);
	console.log(wordArr);

	if (isBannedWord(wordArr)) {
		console.log("banned");
	} else {
		console.log("pass");
	}
});
*/

// TODO: write script to reorder json word list

// current exceptions:
// 'as s' => cannot whitelist 'as' and filter it out via substring
// plural cases