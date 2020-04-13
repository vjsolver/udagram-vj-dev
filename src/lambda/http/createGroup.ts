import { APIGatewayAuthorizerHandler, APIGatewayProxyEvent, APIGatewayProxyCallback, APIGatewayProxyResult, APIGatewayProxyHandler } from "aws-lambda"


const AWS = require('aws-sdk')

var uuid = require('uuid');
const uuidv4 = require('uuid/v4');
console.log(uuid.v4());



const docClient = new AWS.DynamoDB.DocumentClient()
 
const groupsTable = process.env.GROUPS_TABLE

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Processing event: ', event)

  const itemId = uuid.v4()
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


