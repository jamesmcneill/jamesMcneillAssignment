
/**
 * Get the first 3 vanity numbers
 * Wrap them in tags to say as telephone number
 * Add break time after each
 * Wrap everything in speak tags
 * @param {Array} vanityNumbers - array of vanity numbers
 * @returns {Array} messages ready to send to lex as part of close event
 */
function getFirstThreeNumbers (vanityNumbers) {

    const firstThreeNumbers = [];

    for (let index = 0; index < 3; index++) {
        firstThreeNumbers.push(`<say-as interpret-as="telephone">${vanityNumbers[index]}</say-as><break time="1s"/>`);
    }
    
    return [{
        content: "<speak>Your vanity number suggestions are: " + firstThreeNumbers + "</speak>",
        contentType: "SSML"
    }];
}

exports.getFirstThreeNumbers = getFirstThreeNumbers;
