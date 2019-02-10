![Services architecture](https://github.com/cravier/lambda-chunks-dynamodb/blob/master/res/lambda_chunks_insert.png)



# Create S3 bucket and upload JSON file  
``` shell
aws s3 mb s3://wine-dataset
aws s3 cp ./dataset/wine-reviews/wine-dataset.json s3://wine-dataset
```

# Create a role for your lambda function  
Your Lambda function need a role to access to dynamodb, S3, cloudwatch logs.
Line 28 in serverless.yml, replace the text by your arn role you just created.

# Create node_module and deploy stack  
``` shell
cd lambdas/wine-data && npm i
cd ../..
serverless deploy
```

# Test function and log  
``` shell
serverless invoke -f loadWineDataset
serverless logs -f loadWineDataset --tail
```