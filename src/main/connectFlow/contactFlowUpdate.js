import { S3 } from 'aws-sdk';

/**
 * Downloads a JSON contact flow from a s3 bucket
 * Updates the BotAliasArn
 * Uploads the flow to the same bucket
 * Based on environment variables
 * @returns {PutObjectOutput} Reponse back from putObject
 */
exports.handler = async () => {

    let myBucket = process.env.bucket;
    let myBotAliasId = process.env.botAliasId;
    let fileName = process.env.fileName;

    try {

        const s3 = new S3();

        const params = {
            Bucket: myBucket,
            Key: fileName
        };

        const file = await s3.getObject(params)
            .promise();

        if (file) {
            const data = file.Body?.toString();

            const connectFlow = JSON.parse(data);

            connectFlow.modules.forEach(module => {
                if (module.type === 'GetUserInput') {
        
                    module.parameters.forEach(parameter => {
        
                        if (parameter.name === 'BotAliasArn') {
                            parameter.value = myBotAliasId;
                        }
                    });
                }
            });

            const testOutput = JSON.stringify(connectFlow, null, '\t');

            const uploadParams = {
                Bucket: myBucket,
                Key: fileName,
                ContentType: 'application/json',
                Body: Buffer.from(testOutput)
            };

            const result = await s3.putObject(uploadParams).promise();
            
            return result;

        }
        const message = `Error getting object ${params.Key} from bucket ${params.Bucket}. Make sure they exist.`;

        console.error(message);

    } catch (e) {
            console.error('There was a problem with the s3 connection', e);
    }

}
