const ApiBuilder = require('claudia-api-builder');
const AWS = require('aws-sdk');
const uuidv4 = require('uuid/v4');

const api = new ApiBuilder(),
  dynamoDB = new AWS.DynamoDB.DocumentClient();

const ORDERS_TABLE = 'orders';
const ORDERS_ID_VALIDATION_MESSAGE = `Sorry, you haven't provided a orderId`;
const ORDERS_NAME_VALIDATION_MESSAGE = `Sorry, you haven't provided the ordersName`;
const ORDERS_AMOUNT_VALIDATION_MESSAGE = `Sorry, you haven't provided the amount of the order`;
const ORDERS_STATUS_VALIDATION_MESSAGE = `Sorry, you haven't provided the status of the order`;

api.get('/orders', () => {
    return dynamoDB.scan({ TableName: ORDERS_TABLE }).promise()
        .then(response => response.Items)
        .catch(err => err);
});

api.get('/orders/{orderId}', request => {
    let orderId = request.pathParams.orderId;
    if (!orderId) return ORDERS_ID_VALIDATION_MESSAGE;

    return dynamoDB.get({ 
        TableName: ORDERS_TABLE,
        Key: {
            ordersId: orderId
        }
    }).promise()
      .then(response => response.Item)
      .catch(err => err);
});

api.delete('/orders/{orderId}', request => {
    let orderId = request.pathParams.orderId;
    if (!orderId) return ORDERS_ID_VALIDATION_MESSAGE;

    return dynamoDB.delete({ 
        TableName: ORDERS_TABLE,
        Key: {
            ordersId: orderId
        }
    }).promise()
    .catch(err => err);
});

api.post('/orders', request => {
    let ordersName = request.body.ordersName;
    let orderAmount = request.body.amount;
    if (!ordersName) return ORDERS_NAME_VALIDATION_MESSAGE;
    if (!orderAmount) return ORDERS_AMOUNT_VALIDATION_MESSAGE;

    return dynamoDB.put({ 
        TableName: ORDERS_TABLE,
        Item: {
            ordersId: uuidv4(),
            ordersName: ordersName,
            amount: orderAmount,
            orderStatus: 'ACTIVE'
        }
    }).promise()
    .catch(err => err);
}, {status: 201});

api.put('/orders/{orderId}', request => {
    let orderId = request.pathParams.orderId;
    if (!orderId) return ORDERS_ID_VALIDATION_MESSAGE;

    let orderStatus = request.body.orderStatus;
    if (!orderStatus) return ORDERS_STATUS_VALIDATION_MESSAGE;

    let updateParams = {
        TableName: ORDERS_TABLE,
        Key: {
            ordersId: orderId
        },
        UpdateExpression: 'set orderStatus = :s',
        ExpressionAttributeValues: {
            ':s': orderStatus
        },
        ReturnValues: 'UPDATED_NEW'
    }

    let ordersName = request.body.ordersName;
    if (ordersName) {
        updateParams.ExpressionAttributeValues[':n'] = ordersName;
        updateParams.UpdateExpression += ' and ordersName = :n'
    }

    return dynamoDB.update(updateParams)
        .promise()
        .catch(err => err);
});

module.exports = api;