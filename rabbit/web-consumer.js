const amqp = require("amqplib");
connect();
async function connect(){
    try{
        const connection = await amqp.connect("amqp://localhost:5672");
        const channel = await connection.createChannel();
        const function_queue = await channel.assertQueue("web");

        channel.consume("web", message =>{
            const input = JSON.parse(message.content.toString());
            channel.ack(message)
            console.log(input);
            console.log("Receive");
            
        })
    }
    catch(ex){
        console.log(ex);
    }
}