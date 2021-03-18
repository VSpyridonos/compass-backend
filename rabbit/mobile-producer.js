//FOR TESTING REASONS



const amqp = require('amqplib');
var coordinates = {"langtitude": process.argv[2], "longtitude": process.argv[3], "speed": process.argv[4], "time": process.argv[5]}
let channel = null;
connect()


async function connect(){
    try{
        const connection = await amqp.connect("amqp://localhost:5672");
        channel = await connection.createChannel();
        const function_queue = channel.assertQueue("kalman");
        channel.sendToQueue("kalman", Buffer.from(JSON.stringify(coordinates)));
    }
    catch(ex){
        console.log(ex);
    }
}



