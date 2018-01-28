var awsIot = require('aws-iot-device-sdk');
var config = require('config');
var exec = require('child_process').exec;
var sleep = require('sleep');
var util = require('util');

var awsIotDevice = config.get('awsIotDevice');
var remoteDevice = config.get('remoteDevice');

var device = awsIot.device({
  host: awsIotDevice.host,
  port: awsIotDevice.port,
  keyPath: awsIotDevice.keyPath,
  certPath: awsIotDevice.certPath,
  caPath: awsIotDevice.caPath,
  clientId: awsIotDevice.clientId,
  thingName: awsIotDevice.thingName,
  region: awsIotDevice.region
});

var remoteDeviceConfig = config.get('remoteDevice');
var remoteDeviceKeys = Object.keys(remoteDeviceConfig);

device.on('connect', function(){
  var topic;  
  for(var i = 0, len = remoteDeviceKeys.length; i < len; i++){
    topic = 'remote/' + remoteDeviceKeys[i];
    device.subscribe(topic);
    console.log('subscribed to ' + topic);
  }
});

device.on('message', function(topic, message){
  console.log('topic: ' + topic + '  message: ' + message);
  var deviceIotName = topic.replace(/^remote\//, '');
  var remoteDevice = remoteDeviceConfig[deviceIotName];
  var device = remoteDevice.device;
  var alexaDirective = message.toString();
  var remoteKey;
  var command = 'irsend SEND_ONCE %s %s';
  var commandList = [];
  if(alexaDirective.startsWith('ChangeChannel')){
    // need to parse out channel number to individual keys
    // only supporting channel numbers and not names
    var keyPrefix = remoteDevice.keyMap['ChangeChannel'];
    // get only the number portion of the message
    var channel = alexaDirective.match(/ChangeChannel (.*)/)[1];
    if(isNaN(channel)){
      console.log('ERROR: channel was not a number: ' + channel);
      return;
    }
    var i = channel.length;
    while(i--){
      remoteKey = keyPrefix + channel[i];
      commandList.push(util.format(command, device, remoteKey));
    }
    command = util.format(command, device, remoteKey);
  }
  else{
    remoteKey = remoteDevice.keyMap[alexaDirective];
    commandList.push(util.format(command, device, remoteKey));
  }
  executeIrsend(commandList);
});

// sending seperate commands spaced out by 500ms because multiple keys
// in one irsend command is too fast for my Cable box to pick up.
var executeIrsend = function(commandList){
  var result;
  var irCommand = commandList.pop();
  exec(irCommand, (error, stdout, stderr) => {
    result = stdout.trim();
    if(!result){
      console.log('success executing: ' + irCommand);
      if(commandList.length > 0){
        sleep.msleep(500);
        executeIrsend(commandList);
      }
    } else {
      console.log('ERROR: ' + error);
    }
  });
};
