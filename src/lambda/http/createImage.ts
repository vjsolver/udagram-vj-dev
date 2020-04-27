import { APIGatewayProxyEvent,  APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'


// import 'source-map-support/register'
import * as AWS from 'aws-sdk'

import { v4 as uuidv4 } from 'uuid';

const docClient = new AWS.DynamoDB.DocumentClient()

const groupsTable = process.env.GROUPS_TABLE
const imageTable = process.env.IMAGES_TABLE

const s3 = new AWS.S3( {
  signatureVersion: 'v4'
})

const bucketName = process.env.IMAGE_S3_BUCKET
const urlExpiration = process.env.SINNED_URL_EXPIRATION



export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Processing event: ', event)

  const groupId = event.pathParameters.groupId

  const validGroupId = await groupExists(groupId)

  if(!validGroupId) {
    return {
      statusCode: 404,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Group does not exist'

      })
    }
  }

  const imageId = uuidv4()
  console.log('uuid: ', imageId)

  const newItem = await createImage(groupId, imageId, event)
  const url = getUploadUrl(imageId)

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      newItem, 
      uploadUrl: url
    })
  }
}


function getUploadUrl(imageId: string) {
  return s3.getSignedUrl('putObject', {
    Bucket: bucketName,
    Key: imageId,
    Expires: urlExpiration
  })
}

async function groupExists(groupId: string) {
  const result = await docClient.get({
    TableName: groupsTable,
    Key: {
      id: groupId
    }
  }).promise()

  console.log('Get group: ', result)
  return !!result.Item
}

async function createImage(groupId: string, imageId: string, event: any) {
  const timestamp = new Date().toISOString()
  let newImage = JSON.parse(event.body)

  let body = event.body

  if(body == undefined) {
    newImage = event
    console.log('Processing parsed body: ', newImage)

  } else {

    newImage = JSON.parse(body)
    console.log('Parsed parsaed body: ', newImage)
  }

  const newItem = {
    groupId,
    timestamp,
    imageId,
    ...newImage,
    imageUrl: `https://${bucketName}.s3.amazonaws.com/${imageId}`
  }

  console.log('Storing new item: ', newItem);


  await docClient.put({
    TableName: imageTable,
    Item: newItem
  }).promise()

  return newItem
}
