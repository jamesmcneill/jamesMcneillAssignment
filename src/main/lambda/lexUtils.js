
const { getFirstThreeNumbers } = require('./ssmlUtils');

/**
 * Returns a close object to be passed to lex based an incoming lex event and array of vanityNumbers
 * @param {Object} event - Lex event
 * @param {Array} vanityNumbers - Array of vanityNumbers
 * @returns {Object} response to pass back to lex as a close event
 */
async function close (event, vanityNumbers) {
    
    const dialogAction = {
        fulfillmentState: "Fulfilled",
        type: "Close"
    };

    const sessionId = event.sessionId;
    const sessionAttributes = event.sessionState.sessionAttributes;
    const currentIntent = event.sessionState.intent;

    const response = {
        messages: getFirstThreeNumbers(vanityNumbers),
        sessionId,
        sessionState:
            {
                dialogAction,
                intent: currentIntent,
                sessionAttributes
            }
    };

    return response;
}

exports.close = close;
