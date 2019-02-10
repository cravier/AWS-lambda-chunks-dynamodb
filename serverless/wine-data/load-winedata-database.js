'use strict';

var aws = require('aws-sdk');
var s3 = new aws.S3();
var dynamodbClient = new aws.DynamoDB();
var uuid = require('uuid');
var dynamoAttr = require('dynamodb-data-types').AttributeValue;
var response, objectData, bufferBody;

async function getS3DataFile() {
    var params = {
        Bucket: process.env.BUCKET_NAME,
        Key: process.env.KEY_FILE_DATA_SET
    }
    
    console.log("Beginning S3 get json data file...");
    return new Promise((resolve, reject) => {
        s3.getObject(params, (err, data) => {
            if ( err ) reject(err)
            else resolve(data.Body)
        })
    })
}


async function buildChunks(objectData, chunk=10) {
    //Build chunks
    const emptyList = new Array(Math.ceil(objectData.length/chunk)).fill();
    return emptyList
        .map(_ => objectData.splice(0, chunk))
        .map(xx => 
            xx.map(function(x){
                x['id'] = uuid.v1();
                var item = dynamoAttr.wrap(x);      
                return { PutRequest: { Item: item } }
            })
        );
}


async function insertChunks(chunks) {
    var i = 0;
    for(let chunk of chunks) {
        if(Array.isArray(chunk)) {
            var params = {"RequestItems": {}};
            params.RequestItems[process.env.TABLE_NAME] = chunk;
            var ret = await dynamodbClient.batchWriteItem(params).promise()
            
            
            if (ret.UnprocessedItems) {
                chunks.push(ret.UnprocessedItems);
            } 

            i++;
        }
    }
}

exports.handler = async  (event, context) => {
    try {

        bufferBody = await getS3DataFile(); 
        objectData = JSON.parse(bufferBody.toString('utf8'));
        const chunks = await buildChunks(objectData, 25);        
        await insertChunks(chunks);
        
        response = {
            'statusCode': 200,
            'body': JSON.stringify({
                message: 'Load datas dynamodb',
                count_datas: chunks.length + " chunks insérés dans la table."
            })
        }
    } catch (err) {
        console.log("Try catch error...", err)
        return err;
    }

    return response;
};
