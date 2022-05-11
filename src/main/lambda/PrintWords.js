
const autoBind = require('auto-bind');
const { dictionary } = require("./dictionary");
const { putToDb } = require('./dbUtils');
const { close } = require('./lexUtils');

const _event = Symbol('event');

let possibilitesFound;
let vanityNumbers;
let callingNumber;
let numberToCheck;

/**
 * Class to print words
 */
module.exports = class PrintWords {

    /**
     * Constructor
     * @param {Object} event - lex event
     */
    constructor (event) {
        this[_event] = event;
        this.bind(this);
    }

    /**
     * Getter for autoBind
     */
    get bind () {
        return autoBind;
    }

    /**
     * Compare function to sort by length of number then its frequency
     * @param {Array} a - Array of number and frequency in a of compare
     * @param {Array} b - Array of number and frequency in b of compare
     * @returns 
     */
    lengthThenFrequency(a, b) {
        
        const bGreaterThanA = b[1]?.length - a[1]?.length;

        if (bGreaterThanA === 0) 
            return b[0] - a[0];
        else
            return bGreaterThanA
    }

    /**
     * Entry point method
     * @returns {Object} close event
     */
    printWords()
    {
        callingNumber = this[_event].sessionState.sessionAttributes.customerNumber;
        
        let vec = getNumberFrequency();
       
        vec.sort(this.lengthThenFrequency);
        
        numberToCheck = vec[0][1];

        vanityNumbers = [];
        possibilitesFound = 0;
        
        const n = numberToCheck.length;
        const numbersToCheckAsArray = numberToCheck.split("");

        for (let i=n; i>=1; i--) {
            this.printWordsUtil(numbersToCheckAsArray.slice(n - i), 0, [], i);
            if (possibilitesFound >= 5 || i === 1)
            {
                return this.closeOut(vanityNumbers);
            }
        }

        return this.closeOut(vanityNumbers);
        

        /**
         * Build an array of numbers and their frequencies in the calling Number
         * @returns {Array} count array of numbers and their frequencies
         */
        function getNumberFrequency() {

            // get components of a number excluding +, 0 and 1 then remove empty elements
            const numberComponents = callingNumber.split(/(?:0|1|\+)+/).filter(element => element);

            const count = {};

            for (const element of numberComponents) {
                if (count[element]) 
                    count[element] += 1;
                else 
                    count[element] = 1;
            }

            let countArray = new Array(numberComponents.length).fill([]);

            let k = 0;
            for (let it in count) {
                countArray[k] = [count[it], it];
                k += 1;
            }

            return countArray;
        }
    }

    /**
     * Recursive function to build up all permutations of characters based on T9 translations
     * @param {Array} number - number array to get character permutation from
     * @param {int} current - starting at 0, increments with each recursive call
     * @param {Array} possibilityAsArray - the character permutation to be considered as an array
     * @param {int} maxCount - the number of characters we want to create permutations for
     * @returns 
     */
    printWordsUtil(number, current, possibilityAsArray, maxCount)
    {

        const hashTable = [ "0", "1", "abc", "def", "ghi", "jkl",
            "mno", "pqrs", "tuv", "wxyz" ];

        if (current === maxCount)
        {
            const possibility = possibilityAsArray.join("");
            if (dictionary.includes(possibility))
            {
                if (possibilitesFound < 5)
                {
                    this.addToVanityNumbers(possibilityAsArray, possibility);
                }   
            }    
            return;
        }
        
        const numberToCheck = number[current];
        
        for(let i = 0; i < hashTable[numberToCheck].length; i++)
        {
            possibilityAsArray.push(hashTable[numberToCheck][i]);
            this.printWordsUtil(number, current + 1, possibilityAsArray, maxCount);
            possibilityAsArray.pop();

        }
    }

    /**
     * Convert each character back to a number
     * Replace that number sequence in the caller number
     * Add the result to the vanity numbers array
     * @param {Array} possibilityAsArray 
     * @param {String} possibility 
     */
    addToVanityNumbers(possibilityAsArray, possibility) {

        const mapLettersToNumbers = new Map();
            mapLettersToNumbers.set('0', '0');
            mapLettersToNumbers.set('1', '1');
            mapLettersToNumbers.set('a', '2');
            mapLettersToNumbers.set('b', '2');
            mapLettersToNumbers.set('c', '2');
            mapLettersToNumbers.set('d', '3');
            mapLettersToNumbers.set('e', '3');
            mapLettersToNumbers.set('f', '3');
            mapLettersToNumbers.set('g', '4');
            mapLettersToNumbers.set('h', '4');
            mapLettersToNumbers.set('i', '4');
            mapLettersToNumbers.set('j', '5');
            mapLettersToNumbers.set('k', '5');
            mapLettersToNumbers.set('l', '5');
            mapLettersToNumbers.set('m', '6');
            mapLettersToNumbers.set('n', '6');
            mapLettersToNumbers.set('o', '6');
            mapLettersToNumbers.set('p', '7');
            mapLettersToNumbers.set('q', '7');
            mapLettersToNumbers.set('r', '7');
            mapLettersToNumbers.set('s', '7');
            mapLettersToNumbers.set('t', '8');
            mapLettersToNumbers.set('u', '8');
            mapLettersToNumbers.set('v', '8');
            mapLettersToNumbers.set('w', '9');
            mapLettersToNumbers.set('x', '9');
            mapLettersToNumbers.set('y', '9');
            mapLettersToNumbers.set('z', '9');

        const originalNumbersArray = [];

        possibilityAsArray.forEach((letter) => {
            originalNumbersArray.push(mapLettersToNumbers.get(letter));
        });

        const originalNumbers = originalNumbersArray.join("");

        const replacement = new RegExp(originalNumbers, 'g');

        const vanityNumber = callingNumber.replace(replacement, possibility);

        vanityNumbers.push(vanityNumber);
        possibilitesFound++;
    }

    /**
     * Closing operations
     * Call to dynamoDb wrapper
     * Call to lex close wrapper
     * @param {Array} vanityNumbers - vanity numbers to send on to dynamo and lex
     * @returns 
     */
    async closeOut (vanityNumbers) {

        await putToDb(callingNumber, vanityNumbers);

        return close(this[_event], vanityNumbers);
    }

}
