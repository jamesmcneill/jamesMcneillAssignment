const PrintWords = require('./PrintWords');

/**
 * Entry point handler
 * @param {Object} event from invocation from Lex
 * @returns 
 */
exports.handler = async (event) => {
    
    let response;
    
    response = await new PrintWords(event).printWords();

    return response;

};
