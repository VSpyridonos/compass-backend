var amqp = require('amqplib');
const { fineStructureDependencies } = require('mathjs');
var mongoose = require('mongoose');
const User = require('../models/user');
const Measurement = require('../models/measurement');
const Tour = require('../models/tour');
const Point = require('../models/point');


var TaskBroker = function(){
    this.queueName = 'web';
    this.rabbit = {};
    this.mongo= {};
};

//*********************RabbitMQ connection********************
TaskBroker.prototype.connectRabbit = function(){
    return amqp.connect('amqp://localhost:5672')
    .then(function onConnect(connection) {
      this.rabbit.connection = connection;
      return connection.createChannel()
    }.bind(this))

    .then(function onChannelCreated(channel) {
      this.rabbit.channel = channel;
      return channel.assertQueue(this.queueName, {durable: true});
    }.bind(this))

};
//**********************Mongo Connection**********************
TaskBroker.prototype.connectMongo = function(){
    return function(){
        mongoose.connect('mongodb://localhost:27017/dockerApp', {useNewUrlParser:true});
        const db = mongoose.connection;
        }
};

TaskBroker.prototype.connect = function(){
    return this.connectRabbit()
    .then(this.connectMongo())
};

TaskBroker.prototype.disconnect = function(){
    this.db.close();
    this.rabbit.channel.close();
    this.rabbit.connection.close();
};


//getTask gets what you want from the database
//returns
/*{
  previousTours: [],
  measurements: [],
  olderMeasurements: [],
  _id: 6050b309b52be725844a27f1,        
  username: 'giannakis5',
  name: 'giannis',
  email: 'giannis@gmail.com',
  currentTour: 6050b30ab52be725844a27f7,
  __v: 0
}*/
TaskBroker.prototype.getTask = function() {
  
  return User.find();

};
//produceTask sends data to the queue
TaskBroker.prototype.produceTask = function() {
  return function(message) {
    if(message != null) {
      this.rabbit.channel.sendToQueue(this.queueName, new Buffer(JSON.stringify(message)), { deliveryMode: true });
      console.log("Successfully took db object");
      return message;
    }
    return null;
  }.bind(this);
};


var taskBroker = new TaskBroker();


taskBroker.connect()
  .then(function() {
        taskBroker.getTask()
          .then(taskBroker.produceTask())
            .then(function(result){
            if(result == null) {
              console.log('No job to produce');
            } else {
              console.log('Produce', result);
            }

          },function(error){
            console.log('error',error.stack);
          }
        );
    }
      
  );
    
          