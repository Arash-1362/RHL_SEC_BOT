// Copyright (c) Microsoft Corporation. All rights reserved.
//Autor : ARASH DOUST 

const { ActivityHandler, MessageFactory } = require('botbuilder');
const { MakeSecurityDialogs } = require('./componentDialogs/makeSecurityDialogs');
const { IPSecurityDialog} = require('./componentDialogs/ipSecurityDialog');
const { PasswordCount} = require('./componentDialogs/passwordCount');


const {LuisRecognizer,QnAMaker}  = require('botbuilder-ai');
const {CardFactory} = require('botbuilder');

const path = require('path');
const axios = require('axios');
const fs = require('fs');

const unSafeResault = require('./componentDialogs/resources/adaptiveCard/unSafeResault.json')
const safeResault = require('./componentDialogs/resources/adaptiveCard/safeResault.json')

var  con = "";
var endDialog ='';


const CARDS = [

    safeResault,
    unSafeResault

];



class EchoBot extends ActivityHandler {
    constructor(conversationState,userState) {
        super();
        //creating the global objects to be used during dialog flow
        this.conversationState = conversationState;
        this.userState = userState;
        // property accessor to set and get the dialog state
        this.dialogState = conversationState.createProperty("dialogState");
        this.makeSeccurityDialogs = new MakeSecurityDialogs(this.conversationState,this.userState);
        this.ipSecurityDialog = new IPSecurityDialog(this.conversationState,this.userState);
        this.passwordCount = new PasswordCount(this.conversationState,this.userState);

        this.previusIntent = this.conversationState.createProperty("previusIntent");
        this.conversationData = this.conversationState.createProperty('conservationData');




      
        const dispatchRecognizer = new LuisRecognizer({
            applicationId: process.env.LuisAppId,
            endpointKey: process.env.LuisAPIKey,          
            endpoint: `https://westus.api.cognitive.microsoft.com/`
        }, {
          
            apiVersion: 'v3'
        }, true);
 
        


        
      
        const qnaMaker = new QnAMaker({
            
            knowledgeBaseId: 'e5d76505-b8f6-4843-84b8-2a1c6626f50c',
            endpointKey: '30ce98ce-ed97-410d-9d59-306a7a988e6c',
            host: 'https://finalprojectchatbot.azurewebsites.net/qnamaker'
          
        });
        
        //global aobject for Qna maker
        this.qnaMaker = qnaMaker;

      //Processing the message received from the chanel (provided by Adapter)
      this.onMessage(async (context, next) => {
            con = context;
            const luisResult = await dispatchRecognizer.recognize(context)
            const intent = LuisRecognizer.topIntent(luisResult); 
            let entities = undefined

            if(luisResult.entities["url"] !== undefined)
            entities = luisResult.entities["url"][0];

            if(luisResult.entities["ip"] !== undefined)
            entities = luisResult.entities["ip"][0];

            if(luisResult.entities["password"] !== undefined)
            entities = luisResult.entities["password"][0];

            console.log("entiyttyyy is " + intent)
            
            await this.dispatchToIntent(context ,intent ,entities );
            

        
            await next();

        });
   
        this.onDialog(async (context, next) => {
            // Save any state changes. The load happened during the execution of the Dialog.
            await this.conversationState.saveChanges(context, false);
            await this.userState.saveChanges(context, false);
            await next();
        });

        this.onMembersAdded(async (context, next) => { // present the bot on its arrival channel event 
           
            await this.sendWelcomeMessage(context)
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }


    async sendWelcomeMessage(turnContext) {
        const { activity } = turnContext;

        // Iterate over all new members added to the conversation.
        for (const idx in activity.membersAdded) {
            if (activity.membersAdded[idx].id !== activity.recipient.id) {
                const welcomeMessage = `Welcome to Security bot service  ${ activity.membersAdded[idx].name }. `;
                await turnContext.sendActivity(welcomeMessage);
                await this.sendSuggestedActions(turnContext);
            }
        }
    }
    async sendSuggestedActions(turnContext) { // Up on staring the new conversation send suggested action to user 
        var reply = MessageFactory.suggestedActions([
        'FILE SCAN',
        'IP SCAN',
        'PASSWORD SCAN',
        'URL SCAN',],
        'What service do you like to use  today ?');                                                                                                                                                                                                                                                                                                                              
        await turnContext.sendActivity(reply);
    }
//routing all the incomig messages

    async dispatchToIntent(context ,intent ,entities){
          var currentIntent = '';   
          const previusIntent = await this.previusIntent.get(context,{});
          const conversationData = await this.conversationData.get(context,{});
          
        if(previusIntent.intentName && conversationData.endDialog === false ) {
            currentIntent = previusIntent.intentName;
            console.log("inside previus intent"+currentIntent)


        }
        else if ((previusIntent.intentName && conversationData.endDialog === true)){
            currentIntent = intent;

        }
        else if(intent == "None" && !previusIntent.intentName )
        {
            var result = await this.qnaMaker.getAnswers(context)
            if (result[0] !==  undefined )
            await context.sendActivity(`${ result[0].answer}`);
            await this.sendSuggestedActions(context);
        }
        else{
            currentIntent = intent;
            await this.previusIntent.set(context,{intentName:intent });

        }
      
        switch(currentIntent)
    {
        case 'URL_LOOKUP':
         await this.conversationData.set(context,{endDialog: false});
         await this.makeSeccurityDialogs.run(context,this.dialogState ,entities  );
         conversationData.endDialog = await this.makeSeccurityDialogs.isDialogComplete(); //
         if(conversationData.endDialog){
            await this.previusIntent.set(context,{intentName: null});
            await this.sendSuggestedActions(context);
            
        }
        break;
        case 'PASSWORD':
            await this.conversationData.set(context,{endDialog: false});
            await this.passwordCount.run(context,this.dialogState ,entities  );
            conversationData.endDialog = await this.passwordCount.isDialogComplete(); //
            if(conversationData.endDialog){
               await this.previusIntent.set(context,{intentName: null});
               await this.sendSuggestedActions(context);
               
           }
           break;

        case 'IP_LOOKUP': //to be implemented
        console.log("Inside ip");
        await this.conversationData.set(context,{endDialog: false});
        await this.ipSecurityDialog.run(context,this.dialogState,entities);
        conversationData.endDialog = await this.ipSecurityDialog.isDialogComplete();

        if(conversationData.endDialog){
            await this.previusIntent.set(context,{intentName: null});
            await this.sendSuggestedActions(context);
        }
        break;

        case 'Hello':

            await this.previusIntent.set(context,{intentName: null});
            await context.sendActivity("welcome agine !!!");

             await this.sendSuggestedActions(context)
           
           
            break;

            case 'FileUpload':
                

            await this.conversationData.set(context,{endDialog: false});

            if(!context.activity.attachments)
            await context.sendActivity("Pleas upload your file to be scaned  !!!");

            if (context.activity.attachments && context.activity.attachments.length > 0) {
               
            // The user sent an attachment and the bot should handle the incoming attachment.
            await this.handleIncomingAttachment(context );

           

            }

            conversationData.endDialog = await this.isDialogComplete();
            if(conversationData.endDialog){
                await this.previusIntent.set(context,{intentName: null});
                await this.sendSuggestedActions(context);
                endDialog = false;

            }

           
           
            break;

        default:
            await this.previusIntent.set(context,{intentName: null});
            await this.sendSuggestedActions(context);
            break;



    }
}




/**
     * Saves incoming attachments to disk by calling `this.downloadAttachmentAndWrite()` and
     * by make of promise it async the next call to the api and makes sure the file path is obtained 
     * because of the file writing on the disk 
     * @param {Object} turnContext
     */
 async handleIncomingAttachment(turnContext) {
    // Prepare Promises to download each attachment and then execute each Promise.
    const promises = turnContext.activity.attachments.map(this.downloadAttachmentAndWrite);
    const successfulSaves = await Promise.all(promises);

    async function replyForReceivedAttachments(localAttachmentData) {
       
    }

    // Prepare Promises to reply to the user with information about saved attachments.
    // The current TurnContext is bound so `replyForReceivedAttachments` can also send replies.
    const replyPromises = successfulSaves.map(replyForReceivedAttachments.bind(turnContext));
    

    await Promise.all(replyPromises);


            

}







/**
     * Downloads attachment to the disk.
     * @param {Object} attachment
     */
 async downloadAttachmentAndWrite(attachment) {
    // Retrieve the attachment via the attachment's contentUrl.
    const url = attachment.contentUrl;
    // Local file path for the bot to save the attachment.
    const localFileName = path.join(__dirname, attachment.name);

     
        

    try {
        // arraybuffer is necessary for images
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        // If user uploads JSON file, this prevents it from being written as "{"type":"Buffer","data":[123,13,10,32,32,34,108..."
        if (response.headers['content-type'] === 'application/json') {
            response.data = JSON.parse(response.data, (key, value) => {
                return value && value.type === 'Buffer' ? Buffer.from(value.data) : value;
            });
        }
        fs.writeFile(localFileName, response.data, (fsError) => {
            if (fsError) {
                throw fsError;
            }
        });
    } catch (error) {
        console.error(error);
        return undefined;
    }

    
    return new Promise((resolve, reject) => { // Resualt of safe or unsafe URL submitted by user will be shown by calling Adabtive cards

            const nvt = require('node-virustotal');
            const defaultTimedInstance = nvt.makeAPI().setKey('5d0b82b762587006ac0c6bb4197101c8df992dfd08fac4ecaf31b047aa76e866');
            const aMaliciousFile = require('fs').readFileSync(localFileName);
            const hashed = nvt.sha256(aMaliciousFile);
            // const theSameObject1 = defaultTimedInstance.fileLookup(hashed, function(err, res){
            const theSameObject = defaultTimedInstance.uploadFile(aMaliciousFile,  attachment.name, 'application/x-msdownload', function(err, res){
            var road = JSON.parse(res);
            const SameObject = defaultTimedInstance.fileLookup( hashed, function(err, res){
                var road = JSON.parse(res);


                    if (road.data.attributes.last_analysis_results.Kaspersky.result != "clean") {
                       
                        endDialog = true;
                        resolve(endDialog) ;
                        con.sendActivity("Hash of your file is  : "+hashed);

                        con.sendActivity({text: "Your resualt: ",attachments:[CardFactory.adaptiveCard(CARDS [0])]});
                        // con.sendActivity( "Your resualt: ");

                        
                    }
                    else{
    
                        endDialog = true;
                        resolve(endDialog) ;
                    
                        this.sendActivity({text: "Your resualt: ",attachments:[CardFactory.adaptiveCard(CARDS [1])]});
                      
                    }
                });

                }); 
           
    
        })
   
    



 }
 isDialogComplete(){
    return endDialog;
}



}

module.exports.EchoBot = EchoBot;






















