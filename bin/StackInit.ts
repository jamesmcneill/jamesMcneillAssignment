import { Stack } from '../lib/stack';
import { App } from '@aws-cdk/core';

const app = new App();

/**
 * Initalise the stack
 */
new Stack(app, "james-mcneill-vanity-numbers", {
    stackName: "james-mcneill-vanity-numbers",
    env: {
        region: process.env.CDK_DEFAULT_REGION,
        account: process.env.CDK_DEFAULT_ACCOUNT,
      }
});
