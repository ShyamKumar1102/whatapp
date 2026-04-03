/**
 * Run this ONCE to create all DynamoDB tables:
 * node setup-dynamodb.js
 *
 * Requires AWS credentials in backend/.env
 */

import { DynamoDBClient, CreateTableCommand, ListTablesCommand } from '@aws-sdk/client-dynamodb';
import dotenv from 'dotenv';
dotenv.config();

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const tables = [
  { TableName: process.env.DYNAMO_TABLE_USERS          || 'crm_users' },
  { TableName: process.env.DYNAMO_TABLE_CONTACTS       || 'crm_contacts' },
  { TableName: process.env.DYNAMO_TABLE_CONVERSATIONS  || 'crm_conversations' },
  { TableName: process.env.DYNAMO_TABLE_MESSAGES       || 'crm_messages' },
  { TableName: process.env.DYNAMO_TABLE_NOTES          || 'crm_notes' },
  { TableName: process.env.DYNAMO_TABLE_REMINDERS      || 'crm_reminders' },
  { TableName: process.env.DYNAMO_TABLE_CAMPAIGNS      || 'crm_campaigns' },
  { TableName: process.env.DYNAMO_TABLE_PIPELINE       || 'crm_pipeline_stages' },
  { TableName: 'crm_templates' },
];

const createTable = async (tableName) => {
  try {
    await client.send(new CreateTableCommand({
      TableName:            tableName,
      AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
      KeySchema:            [{ AttributeName: 'id', KeyType: 'HASH' }],
      BillingMode:          'PAY_PER_REQUEST', // on-demand — no capacity planning needed
    }));
    console.log(`✅ Created table: ${tableName}`);
  } catch (err) {
    if (err.name === 'ResourceInUseException') {
      console.log(`⏭️  Table already exists: ${tableName}`);
    } else {
      console.error(`❌ Failed to create ${tableName}:`, err.message);
    }
  }
};

const run = async () => {
  console.log(`\n🔧 Setting up DynamoDB tables in region: ${process.env.AWS_REGION}\n`);
  for (const t of tables) {
    await createTable(t.TableName);
  }
  console.log('\n✅ DynamoDB setup complete!\n');
  console.log('Next steps:');
  console.log('1. Tables are ready — restart your backend');
  console.log('2. The backend will now use DynamoDB instead of in-memory store');
  console.log('3. All data will persist across server restarts\n');
};

run();
