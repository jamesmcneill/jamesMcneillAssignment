import * as lex from '@aws-cdk/aws-lex';
import {
    App,
    CfnOutput,
    CustomResource,
    Duration,
    Stack as BaseStack,
    StackProps
} from '@aws-cdk/core';
import {
    Effect,
    Policy,
    PolicyStatement,
    Role,
    ServicePrincipal
} from '@aws-cdk/aws-iam';
import {
    Function,
    Permission,
    Runtime
} from '@aws-cdk/aws-lambda';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import { CfnTable } from '@aws-cdk/aws-dynamodb/lib';
import { Provider } from '@aws-cdk/custom-resources';
import { Bucket } from '@aws-cdk/aws-s3';
import { BucketDeployment, Source } from '@aws-cdk/aws-s3-deployment';

let id: string;

/**
 * Stack
 */
export class Stack extends BaseStack {

    static readonly LOCALE_ID = 'en_US';

    /**
     * Constructor
     * @param {Construct} scope - Scope
     * @param {String} id - Identifier
     * @param {StackProps} props - Stack properties
     */
    constructor (scope: App, idIn: string, props: StackProps) {

        super(scope, id, props);

        id = idIn;

        const bot = this.getBot();
        const version = new lex.CfnBotVersion(this, `${id}-version-${this.getRandom()}`, {
            botId: bot.attrId,
            botVersionLocaleSpecification: [
                {
                    botVersionLocaleDetails: {
                        sourceBotVersion: 'DRAFT'
                    },
                    localeId: Stack.LOCALE_ID
                }
            ],
            description: 'Latest version'
        });

        const lambda = this.getLambdaFunction();
        const alias = new lex.CfnBotAlias(this, `${id}-alias`, {
            botAliasLocaleSettings: [
                {
                    botAliasLocaleSetting: {
                        codeHookSpecification: {
                            lambdaCodeHook: {
                                codeHookInterfaceVersion: '1.0',
                                lambdaArn: lambda.functionArn
                            }
                        },
                        enabled: true
                    },
                    localeId: Stack.LOCALE_ID
                }
            ],
            botAliasName: `${id}-alias`,
            botId: bot.attrId,
            botVersion: version.attrBotVersion,
            description: id
        });

        const invokeLambdaPermission: Permission = {
            action: 'lambda:InvokeFunction',
            principal: new ServicePrincipal('lex.amazonaws.com'),
            sourceArn: alias.attrArn
        };

        lambda.addPermission('invoke-lambda-permission', invokeLambdaPermission);

        new CfnTable(this, `${id}-table`, {
            attributeDefinitions: [{
                attributeName: 'phoneNumber',
                attributeType: 'S'
            }],
            keySchema: [{
                attributeName: 'phoneNumber',
                keyType: 'HASH'
            }],
            provisionedThroughput: {
                readCapacityUnits: 1,
                writeCapacityUnits: 1
            },
            tableName: 'jamesMcNeillVanityNumbers'
        });

        const myBucket = new Bucket(this, `${id}-bucket`, {
            bucketName: `${id}-bucket`
        });

        const connectFlowFile = 'vanityPhoneNumberFlow';

        const itemToUpload = Source.asset('./src/main/connectFlow/flow');

        const deployment = new BucketDeployment(this, `${id}-deployFiles`, {
            sources: [itemToUpload],
            destinationBucket: myBucket,
        });

        const region = Stack.of(this).region;

        const linkToConnectFlow = `https://${region}.console.aws.amazon.com/s3/object/${myBucket.bucketName}?region=${region}&prefix=${connectFlowFile}`

        new CfnOutput(this, `${id}-connectFlowUrl`, {
            description: "Here is the link to your connect flow with the new bot alias arn",
            value: linkToConnectFlow
        })

        const customProviderFunction = new NodejsFunction(this, `${id}-connectFlow`, {
            description: 'Connect flow update',
            entry: `src/main/connectFlow/contactFlowUpdate.js`,
            environment: {
                botAliasId: alias.attrArn,
                bucket: deployment.deployedBucket.bucketName,
                fileName: connectFlowFile
            },
            functionName: `${id}-connectFlow`,
            handler: 'handler',
            memorySize: 1024, // eslint-disable-line no-magic-numbers
            runtime: Runtime.NODEJS_14_X,
            timeout: Duration.seconds(20) // eslint-disable-line no-magic-numbers
        });

        myBucket.grantReadWrite(customProviderFunction);

        const provider = new Provider(this, 'ResourceProvider', {
            onEventHandler: customProviderFunction
         });

        const providerCustomResource = new CustomResource(this, 'providerCustomResource', {
            serviceToken: provider.serviceToken,
         });


         providerCustomResource.node.addDependency(deployment.deployedBucket);

    }

    /**
     * Returns code hook Lambda function.
     * @returns {Function} Lambda function
     */
    getLambdaFunction (): Function { // eslint-disable-line @typescript-eslint/ban-types
        const role = this.getLambdaRole();

        return new NodejsFunction(this, `${id}-lambda`, {
            awsSdkConnectionReuse: true,
            description: 'Fulfillment Lambda',
            entry: `src/main/lambda/lambda.js`,
            environment: {
            },
            functionName: `${id}-lambda`,
            handler: 'handler',
            memorySize: 1024, // eslint-disable-line no-magic-numbers
            role,
            runtime: Runtime.NODEJS_14_X,
            timeout: Duration.seconds(20) // eslint-disable-line no-magic-numbers
        });
    }

    /**
     * Returns Lex bot.
     * @returns {lex.CfnBot} Bot
     */
    getBot (): lex.CfnBot {
        const botRole = this.getBotRole();

        const bot = new lex.CfnBot(this, `${id}-bot`, {
            botLocales: [
                {
                    description: `${Stack.LOCALE_ID} locale`,
                    intents: [
                        {
                            description: 'Enter Number',
                            dialogCodeHook: {
                                enabled: true
                            },
                            fulfillmentCodeHook: {
                                enabled: true
                            },
                            name: 'EnterNumber',
                            sampleUtterances: [
                                {
                                    utterance: 'Yes'
                                }
                            ],
                            slotPriorities: [
                                {
                                    priority: 1,
                                    slotName: 'numberToCheck'
                                }
                            ],
                            slots: [
                                {
                                    description: 'Number to check',
                                    name: 'numberToCheck',
                                    slotTypeName: 'AMAZON.PhoneNumber',
                                    valueElicitationSetting: {
                                        promptSpecification: {
                                            allowInterrupt: false,
                                            maxRetries: 1,
                                            messageGroupsList: [
                                                {
                                                    message: {
                                                        plainTextMessage: {
                                                            value: 'Enter a phone number to get some vanity number suggestions.'
                                                        }
                                                    }
                                                }
                                            ]
                                        },
                                        slotConstraint: 'Required'
                                    }
                                }
                            ]
                        },
                        {
                            description: 'Default intent when no other intent matches',
                            intentClosingSetting: {
                                closingResponse: {
                                    messageGroupsList: [
                                        {
                                            message: {
                                                plainTextMessage: {
                                                    value: 'Sorry I didn\'t understand that.'
                                                }
                                            }
                                        }
                                    ]
                                },
                                isActive: true
                            },
                            name: 'FallbackIntent',
                            parentIntentSignature: 'AMAZON.FallbackIntent'
                        }
                    ],
                    localeId: Stack.LOCALE_ID,
                    nluConfidenceThreshold: 0.4,
                    voiceSettings: {
                        voiceId: 'Joanna'
                    }
                }
            ],
            dataPrivacy: {
                ChildDirected: true
            },
            description: 'Generated Lex Chatbot',
            idleSessionTtlInSeconds: 300,
            name: `${id}-bot`,
            roleArn: botRole.roleArn
        });

        return bot;
    }

    /**
     * Returns IAM role used by Lex bot.
     * @returns {Role} IAM role for Lex bot
     */
    getBotRole (): Role {
        const role = new Role(this, `${id}-bot-role`, {
            assumedBy: new ServicePrincipal('lex.amazonaws.com')
        });

        const policy = new Policy(this, `${id}-policy-log-bot`, {
            policyName: 'Logs',
            statements: [
                new PolicyStatement({
                    actions: [
                        'logs:CreateLogGroup',
                        'logs:CreateLogStream',
                        'logs:PutLogEvents'
                    ],
                    effect: Effect.ALLOW,
                    resources: ['arn:aws:logs:*:*:*']
                })
            ]
        });

        role.attachInlinePolicy(policy);

        return role;
    }

    /**
     * Returns IAM role used by Lambda code hook.
     * @returns {Role} IAM role for Lambda
     */
    getLambdaRole (): Role {
        const role = new Role(this, `${id}-lambda-role`, {
            assumedBy: new ServicePrincipal('lambda.amazonaws.com')
        });

        const logPolicy = new Policy(this, `${id}-policy-log-lambda`, {
            policyName: 'Logs',
            statements: [
                new PolicyStatement({
                    actions: [
                        'logs:CreateLogGroup',
                        'logs:CreateLogStream',
                        'logs:PutLogEvents'
                    ],
                    effect: Effect.ALLOW,
                    resources: ['arn:aws:logs:*:*:*']
                })
            ]
        });

        role.attachInlinePolicy(logPolicy);

        const dynamoPolicy = new Policy(this, `${id}-dynamo-lambda`, {
            policyName: 'Dynamo',
            statements: [
                new PolicyStatement({
                    actions: [
                        'dynamodb:PutItem',
                        'dynamodb:UpdateItem'
                    ],
                    effect: Effect.ALLOW,
                    resources: ['arn:aws:dynamodb:*:*:table/jamesMcNeillVanityNumbers']
                })
            ]
        });

        role.attachInlinePolicy(dynamoPolicy);

        return role;
    }

    /**
     * Returns random string.
     * @returns {String} Random identifier
     */
     getRandom = () : string => Math.random()
        .toString(36) // eslint-disable-line no-magic-numbers
        .replace(/[^a-z]+/g, '')
        .substring(0, 5); // eslint-disable-line no-magic-numbers

}
