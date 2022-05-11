const PrintWords = require('../../main/lambda/PrintWords');
const templateEvent = require('./event.json');
const AwsMock = require('aws-sdk-mock');

process.env.region = 'us-east-1';

describe('Print Words', () => {

    beforeEach(() => {

        AwsMock.mock('CloudWatch', 'putMetricData', (params, callback) => {
            callback(null, {
            });
        });
    });

    afterEach(() => {
        AwsMock.restore();
    });

    describe('Success', () => {

        it('Default with my phone number', done => {

            const testEvent = JSON.parse(JSON.stringify(templateEvent));

            const expectedMessageContent =
                '<speak>Your vanity number suggestions are: ' +
                '<say-as interpret-as="telephone">+44btw0167047</say-as><break time="1s"/>,' +
                '<say-as interpret-as="telephone">+44buy0167047</say-as><break time="1s"/>,' +
                '<say-as interpret-as="telephone">+442tx0167047</say-as><break time="1s"/></speak>';

            const expectedDynamoParams =
            {
                TableName: 'jamesMcNeillVanityNumbers',
                Item: {
                    phoneNumber: '+442890167047',
                    topFiveVanityNumbers:
                        [
                            '+44btw0167047',
                            '+44buy0167047',
                            '+442tx0167047',
                            '+4428w0167047',
                            '+4428z0167047'
                        ]
                }
            };

            AwsMock.mock('DynamoDB.DocumentClient', 'put', (params, callback) => {

                expect(params).toEqual(expectedDynamoParams);
                callback(null, {});
            });

            new PrintWords(testEvent).printWords().then(response => {
                expect(response.messages[0].content).toEqual(expectedMessageContent);
                done();
            })

        });

        it('with 3 letter words that repeat twice and a 2 letter word that repeats three times', done => {

            const testEvent = JSON.parse(JSON.stringify(templateEvent));

            testEvent.sessionState.sessionAttributes.customerNumber = '+943008430843'

            const expectedMessageContent =
                '<speak>Your vanity number suggestions are: ' +
                '<say-as interpret-as="telephone">+94300the0the</say-as><break time="1s"/>,' +
                '<say-as interpret-as="telephone">+94300tie0tie</say-as><break time="1s"/>,' +
                '<say-as interpret-as="telephone">+9hd008hd08hd</say-as><break time="1s"/></speak>';

            const expectedDynamoParams =
            {
                TableName: 'jamesMcNeillVanityNumbers',
                Item: {
                    phoneNumber: '+943008430843',
                    topFiveVanityNumbers:
                        [
                            '+94300the0the',
                            '+94300tie0tie',
                            '+9hd008hd08hd',
                            '+9he008he08he',
                            '+9ie008ie08ie'
                        ]
                }
            };

            AwsMock.mock('DynamoDB.DocumentClient', 'put', (params, callback) => {

                expect(params).toEqual(expectedDynamoParams);
                callback(null, {});
            });

            new PrintWords(testEvent).printWords().then(response => {
                expect(response.messages[0].content).toEqual(expectedMessageContent);
                done();
            })

        });

        it('with 3 letter words that appear once and a 2 letter word that repeats twice', done => {

            const testEvent = JSON.parse(JSON.stringify(templateEvent));

            testEvent.sessionState.sessionAttributes.customerNumber = '+442043441430'

            const expectedMessageContent =
                '<speak>Your vanity number suggestions are: ' +
                '<say-as interpret-as="telephone">+44204dig1430</say-as><break time="1s"/>,' +
                '<say-as interpret-as="telephone">+44204egg1430</say-as><break time="1s"/>,' +
                '<say-as interpret-as="telephone">+hi2043hi1430</say-as><break time="1s"/></speak>';

            const expectedDynamoParams =
            {
                TableName: 'jamesMcNeillVanityNumbers',
                Item: {
                    phoneNumber: '+442043441430',
                    topFiveVanityNumbers:
                        [
                            '+44204dig1430',
                            '+44204egg1430',
                            '+hi2043hi1430',
                            '+gg20g3gg1g30',
                            '+ii20i3ii1i30'
                        ]
                }
            };

            AwsMock.mock('DynamoDB.DocumentClient', 'put', (params, callback) => {

                expect(params).toEqual(expectedDynamoParams);
                callback(null, {});
            });

            new PrintWords(testEvent).printWords().then(response => {
                expect(response.messages[0].content).toEqual(expectedMessageContent);
                done();
            })

        });

        it('with 2 letter words that repeat twice', done => {

            const testEvent = JSON.parse(JSON.stringify(templateEvent));

            testEvent.sessionState.sessionAttributes.customerNumber = '+442042101430'

            const expectedMessageContent =
                '<speak>Your vanity number suggestions are: ' +
                '<say-as interpret-as="telephone">+4ga0ga101430</say-as><break time="1s"/>,' +
                '<say-as interpret-as="telephone">+4gb0gb101430</say-as><break time="1s"/>,' +
                '<say-as interpret-as="telephone">+4ha0ha101430</say-as><break time="1s"/></speak>';

            const expectedDynamoParams =
            {
                TableName: 'jamesMcNeillVanityNumbers',
                Item: {
                    phoneNumber: '+442042101430',
                    topFiveVanityNumbers:
                        [
                            '+4ga0ga101430',
                            '+4gb0gb101430',
                            '+4ha0ha101430',
                            '+4ia0ia101430',
                            '+4ic0ic101430'
                        ]
                }
            };

            AwsMock.mock('DynamoDB.DocumentClient', 'put', (params, callback) => {

                expect(params).toEqual(expectedDynamoParams);
                callback(null, {});
            });

            new PrintWords(testEvent).printWords().then(response => {
                expect(response.messages[0].content).toEqual(expectedMessageContent);
                done();
            })

        });

        it('with a 9 letter word', done => {

            const testEvent = JSON.parse(JSON.stringify(templateEvent));

            testEvent.sessionState.sessionAttributes.customerNumber = '266787828466'

            const expectedMessageContent =
                '<speak>Your vanity number suggestions are: ' +
                '<say-as interpret-as="telephone">construction</say-as><break time="1s"/>,' +
                '<say-as interpret-as="telephone">26678station</say-as><break time="1s"/>,' +
                '<say-as interpret-as="telephone">266787828hon</say-as><break time="1s"/></speak>';

            const expectedDynamoParams =
            {
                TableName: 'jamesMcNeillVanityNumbers',
                Item: {
                    phoneNumber: '266787828466',
                    topFiveVanityNumbers:
                        [
                            'construction',
                            '26678station',
                            '266787828hon',
                            '266787828imo',
                            '266787828inn'
                        ]
                }
            };

            AwsMock.mock('DynamoDB.DocumentClient', 'put', (params, callback) => {

                expect(params).toEqual(expectedDynamoParams);
                callback(null, {});
            });

            new PrintWords(testEvent).printWords().then(response => {
                expect(response.messages[0].content).toEqual(expectedMessageContent);
                done();
            })

        });
    });

});
