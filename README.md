# AlexaLirc

By bbtinkerer (<http://bb-tinkerer.blogspot.com/>)

## Description

Amazon Alexa frontend to [LIRC](http://www.lirc.org) using [Node.js](https://nodejs.org/en/) on a Raspberry Pi Zero W. Control your not so smart TV or cable box (or almost any entertainment device with IR controls) with your voice.

The following Alexa capabilities were implemented (with some limitations, see Limitations section):
* Power Controller
* Channel Controller
* Input Controller
* Step Speaker

## Requirements

* [LIRC](http://www.lirc.org) - Follow instructions from the web to install and setup on your system.
* [Node.js](https://nodejs.org/en/) - Ensure at least 9.3.0 Node.js is installed. I used [audstanley's](http://www.audstanley.com/) scripts at  [NodeJs-Raspberry-Pi ](https://github.com/audstanley/NodeJs-Raspberry-Pi/) to install the latest Node.js. Follow the README.md for instructions on using his script.

## Installation
This installation assumes you have followed my Instructable [placeholder till i get the instructable up] to have the following setup:
* An AWS IOT Thing to connect to.
* Setup LIRC for at least one controller software wise.
* Setup LIRC hardware wise on your Raspberry Pi Zero W (IR LED hooked up and working).
* An AWS Lambda that connects Alexa to your AWS IOT Thing.
* An Alexa Home Skill that connexts to the AWS Lambda.
* Discovered at least the Television device in the Alexa app.


Clone this project to /home/pi/nodejs/AlexaLirc and download required depencencies.

```bash
cd ~
mkdir nodejs
git clone https://github.com/bbtinkerer/AlexaLirc.git
cd nodejs/AlexaLirc/
npm install
```

Create configuration files. For now, just copy the examples and update them as neccessary (you can leave production.json alone).

```bash
cd config/
cp default.example.json default.json
cp production.example.json production.json
```

Make the following updates to awsIotDevice of default.json.

* host: Your AWS IOT Endpoint. The endpoint is in the form xxxxxxxxxxxxxx.iot.us-east-1.amazonaws.com found in the Interact tab of your AWS IOT Things Manage page.
* keyPath: The path to the private key associated to your AWS IOT.
* certPath: The path to the certificate to the thing associated to your AWS IOT.
* caPath: The path to the root authority certificate that issued your AWS IOT certificates.
* clientId: Your AWS IOT Thing name.
* thingName: Your AWS IOT Thing name.
* region: The region your AWT IOT Endpoint resides. Can be found in the Endpoint address, something like us-east-1.

Update remoteDevice in default.json.
* device: The name of the device in your LIRC configuration file.

Update keyMap properties to the key names used in your LIRC configuration file. One exception is for ChangeChannel which needs to be the prefix you used for channel numbers.

Repeat if you have more devices or remove the second entry if you only have one.

Connect to your AWS IOT MQTT endpoint by entering the following:

```bash
cd ~/nodejs/AlexaLirc/
node app.js
```

You should see the following if everything went okay.
```
subscribed to remote/RasPi-TV-001
subscribed to remote/RasPi-Cable-001
```

Test by asking "Alexa, turn on television". You should see the following in the terminal.

```
topic: remote/RasPi-TV-001  message: TurnOn
success executing: irsend SEND_ONCE LivingRoomTv KEY_POWER
```

If you had the IR LED pointing at your television, your television should have responded as if you had pressed the power button on your remote.

## Configuration

### Node.js config file

Configuration files are in the config folder. The files are:
* default.json - Main settings file for connecting to the AWS IOT endpoint and defining your devices. 
* production.json - Empty but needed when running in production mode.

You will need to edit default.json. Following is an example of the default.json file included with the project. It should pretty much be self-explanatory. If you followed my Instructable, you would just need to update host and region. 

```json
{
  "awsIotDevice": {
    "host": "xxxxxxxxxxxxxx.iot.region.amazonaws.com",
    "port": 8883,
    "keyPath": "./certs/private.pem.key",
    "certPath": "./certs/certificate.pem.crt",
    "caPath": "./certs/root-ca.pem",
    "clientId": "UniversalRasPiRemote",
    "thingName": "UniversalRasPiRemote",
    "region": "region"
  },
  "remoteDevice":{
    "RasPi-TV-001": {
      "device": "LivingRoomTv",
      "keyMap": {
        "TurnOn": "KEY_POWER",
        "TurnOff": "KEY_POWER",
        "ChangeChannel": "KEY_",
        "SkipChannels UP": "KEY_CHANNEL_UP",
        "SkipChannels DOWN": "KEY_CHANNEL_DOWN",
        "SelectInput": "KEY_SOURCE",
        "AdjustVolume DOWN": "KEY_VOLUME_DOWN",
        "AdjustVolume UP": "KEY_VOLUME_UP",
        "SetMute": "KEY_MUTE"
      }
    },
    "RasPi-Cable-001": {
      "device": "CableBox",
      "keyMap": {
        "TurnOn": "KEY_POWER",
        "TurnOff": "KEY_POWER",
        "ChangeChannel": "KEY_",
        "SkipChannels UP": "KEY_CHANNEL_UP",
        "SkipChannels DOWN": "KEY_CHANNEL_DOWN"
      }
    }
  }
}
```

Here is my try at the schema for the configuration file, hopefully it makes sense. You should be able to deduce from the example above what each setting does.

```json
{
  "$schema": "http://json-schema.org/draft-06/schema#",
  "title": "App Configuration",
  "type": "object",
  "properties":{
    "awsIotDevice": {
      "properties":{
        "type": "object",
        "properties": {
          "host": {
            "description": "Your AWS IOT Endpoint address"
            "type": "string",
            "required": true
          },
          "port": {
            "description": "Port for your AWS IOT Thing"
            "type": "integer",
            "required": true
          },
          "keyPath": {
            "description": "Path to your private key to connect to your AWS IOT Thing"
            "type": "string",
            "required": true
          },
          "certPath": {
            "description": "Path to your certificate to connect to your AWS IOT Thing"
            "type": "string",
            "required": true
          },
          "caPath": {
            "description": "Path to the root certificate authority cert that issued your private key and certficate."
            "type": "string",
            "required": true
          },
          "clientId": {
            "description": "Your AWS IOT Thing clientId"
            "type": "string",
            "required": true
          },
          "thingName": {
            "description": "Your AWS IOT Thing name (should be same as clientId)"
            "type": "string",
            "required": true
          },
          "region": {
            "description": "The region your AWS IOT Endpoint resides."
            "type": "string",
            "required": true
          },
        }
      }
    },
    "remoteDevice":{
      "patternProperties": {
        "[-A-Za-z0-9]+":{
          "title": "remoteDevice",
          "type": "object",
          "properties": {
            "device":{
              "description": "Name of LIRC device.",
              "type": "string"
              "required": true
            },
            "keyMap": {
              "type": "object",
              "properties": {
                "TurnOn": {
                  "description": "Key mapping to LIRC for power button.",
                  "type": "string",
                  "required": false
                },
                "TurnOff": {
                  "description": "Key mapping to LIRC for power button.",
                  "type": "string",
                  "required": false
                },
                "ChangeChannel": {
                  "description": "Key mapping prefix to LIRC for number buttons.",
                  "type": "string",
                  "required": false
                },
                "SkipChannels Up": {
                  "description": "Key mapping to LIRC for channel up button.",
                  "type": "string",
                  "required": false
                },
                "SkipChannels DOWN": {
                  "description": "Key mapping to LIRC for channel down button.",
                  "type": "string",
                  "required": false
                },
                "SelectInput": {
                  "description": "Key mapping to LIRC for source/input button.",
                  "type": "string",
                  "required": false
                },
                "AdjustVolume UP": {
                  "description": "Key mapping to LIRC for volume up button.",
                  "type": "string",
                  "required": false
                },
                "AdjustVolume DOWN": {
                  "description": "Key mapping to LIRC for volume down button.",
                  "type": "string",
                  "required": false
                },
                "SetMute": {
                  "description": "Key mapping to LIRC for mute button.",
                  "type": "string",
                  "required": false
                },
              },
              "required": true
            }
          }
        },
        "description": "This will be the subtopic to subscribe to."
      },
      "description": "Devices to control."
    }
  }
}
```

## Usage

Run the application in production mode to give a performance boost.

```bash
NODE_ENV=production node app.js
```

### Start on boot up

Sorry, this section is best up to searching the web as different operating systems have different setup and settings.

## Limitations
This project is for not so smart televisions. There is no way to ensure what state the television is in. 
* Power controls are just toggles, so saying "Alexa, turn on television" is the same as "Alexa, turn off television". You can turn off the television if its already on by saying "Alexa, turn on television".
* As with power, mute and unmute is the same and is just a toggle.
* The Alexa Input interface needs an input name to change to work properly. So you need to say "Alexa, change input to '(something)' on television". Then repeat saying that till you get to the input you want to get to.
* No channel name to channel number mapping. eg. "Alexa, change channel to Cartoon Network" does not work. This will require maintaining a name to number mapping.

## Known Issues

If you discover any bugs, feel free to create an issue on GitHub fork and
send a pull request.


## Authors

* bbtinkerer (https://github.com/bbtinkerer/)


## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request


## License

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>.
