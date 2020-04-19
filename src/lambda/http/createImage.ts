import { APIGatewayProxyEvent,  APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'


// import 'source-map-support/register'
import * as AWS from 'aws-sdk'

import { v4 as uuidv4 } from 'uuid';
 
const docClient = new AWS.DynamoDB.DocumentClient()

const groupsTable = process.env.GROUPS_TABLE

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Processing event: ', event)

  const itemId = uuidv4()
  console.log('uuid: ', itemId)

  let body = event.body
  let parsedBody = undefined

  if(body == undefined) {
    parsedBody = event
    console.log('Processing parsed body: ', parsedBody)

  } else {

    parsedBody = JSON.parse(body)
    console.log('Parsed parsaed body: ', parsedBody)
  }
  const newItem = {
    id: itemId,
    ...parsedBody
  }

  await docClient.put({
    TableName: groupsTable,
    Item: newItem
  }).promise()

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      newItem
    })
  }
}
