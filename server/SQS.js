const AWS = require('aws-sdk');

AWS.config.update({ region: 'us-west-1' });

const sqs = new AWS.SQS({ apiVersion: '2012-11-05' });

exports.sendToQueue = function send(sendQueueURL, msg) {
  const sendParams = {
    MessageBody: JSON.stringify(msg),
    DelaySeconds: 0,
    QueueUrl: sendQueueURL,
  };
  console.log('before send message');
  sqs.sendMessage(sendParams, (err, data) => {
    if (err) console.log('Error in send to queue:', err, err.stack);
    else console.log('Queue send response data:', data);
  });
  console.log('after send message');
};
exports.receiveFromQueue = function receiveFromQueue(receiveQueueURL, callback) {
  return new Promise((resolve, reject) => {
    const params = {
      AttributeNames: [
        'SentTimestamp',
      ],
      MaxNumberOfMessages: 10,
      MessageAttributeNames: [
        'All',
      ],
      QueueUrl: receiveQueueURL,
      VisibilityTimeout: 30,
      WaitTimeSeconds: 20,
    };
    const deleteBatchParams = {
      Entries: [],
      QueueUrl: receiveQueueURL,
    };
    sqs.receiveMessage(params, (err, data) => {
      if (err) {
        console.log('Error: ', err);
        reject(err);
      } else if (data.Messages) {
        data.Messages.forEach((message) => {
          callback(message);
          const deleteParams = {
            Id: message.MessageId,
            ReceiptHandle: message.ReceiptHandle,
          };
          deleteBatchParams.Entries.push(deleteParams);
        });
        sqs.deleteMessageBatch(deleteBatchParams, (err, data) => {
          if (err) {
            console.log('Delete Error', err);
          } else {
            // console.log('Message Deleted', data);
          }
        });

        resolve();
      } else {
        // console.log('next');
        resolve();
      }
    });
  });
};
