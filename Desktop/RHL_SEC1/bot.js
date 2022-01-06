// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, MessageFactory } = require('botbuilder');
const { MakeSecurityDialogs } = require('./componentDialogs/makeSecurityDialogs');
const { IPSecurityDialog} = require('./componentDialogs/ipSecurityDialog');
const {LuisRecognizer}  = require('botbuilder-ai');


//checking git here 
class EchoBot extends ActivityHandler {
    constructor(conversationState,userState) {
        super();
        this.conversationState = conversationState;
        this.userState = userState;
        this.dialogState = conversationState.createProperty("dialogState");
        this.makeSeccurityDialogs = new MakeSecurityDialogs(this.conversationState,this.userState);
        this.ipSecurityDialog = new IPSecurityDialog(this.conversationState,this.userState);
        this.previusIntent = this.conversationState.createProperty("previusIntent");
        this.conversationData = this.conversationState.createProperty('conservationData');

    
      
        const dispatchRecognizer = new LuisRecognizer({
            applicationId: process.env.LuisAppId,
            endpointKey: process.env.LuisAPIKey,          
            endpoint: `https://westus.api.cognitive.microsoft.com/`
        }, {
          
            apiVersion: 'v3'
        }, true);
 
        


      //  See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
      //Processing the message received from the chanel (provided by Adapter)
        this.onMessage(async (context, next) => {


            const luisResult = await dispatchRecognizer.recognize(context)
            const intent = LuisRecognizer.topIntent(luisResult); 
            let entities = undefined
            if(luisResult.entities["url"] !== undefined){
            entities = luisResult.entities["url"][0];
            await this.dispatchToIntent(context ,intent ,entities );


            }else{
            await this.makeSeccurityDialogs.run(context,this.dialogState ,entities  );
          

            }
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
        var reply = MessageFactory.suggestedActions(['DomainLookup.',
        'UrlLookup',
        'IP Lookup',
        'DomainComment Lookup',
        'FileLookup',
        'FileUpload',
        'DomainCommentLookup',
        'UrlCommentLookup',
        'UrlNetworkLocations'],'What service do you like to use  today ?');                                                                                                                                                                                                                                                                                                                              
        await turnContext.sendActivity(reply);
    }
//routing all the incomig messages
    async dispatchToIntent(context ,intent ,entities){
          var currentIntent = '';   
          const previusIntent = await this.previusIntent.get(context,{});
          const conversationData = await this.conversationData.get(context,{});
          
        if(previusIntent.intentName && conversationData.endDialog === false ) {
            currentIntent = previusIntent.intentName;

        }
        else if ((previusIntent.intentName && conversationData.endDialog === true)){
            currentIntent = intent;

        }
        else{
            currentIntent = intent;
            await this.previusIntent.set(context,{intentName:intent });

        }
      
        switch(currentIntent)
    {
        case 'URL_LOOKUP':
        // console.log("Inside URL look up");
         await this.conversationData.set(context,{endDialog: false});

        
        if(entities === undefined){

        await this.makeSeccurityDialogs.run(context,this.dialogState ,entities  );

        console.log("shooowwwwwww mmmmmwww")

        }
        
        else{


        return new Promise((resolve, reject) => { // Resualt of safe or unsafe URL submitted by user will be shown by calling Adabtive cards

          
                const nvt = require('node-virustotal');
                   const defaultTimedInstance = nvt.makeAPI().setKey('5d0b82b762587006ac0c6bb4197101c8df992dfd08fac4ecaf31b047aa76e866');
                    const hashed = nvt.sha256( entities);
                    
                    const theSameObject = defaultTimedInstance.urlLookup(hashed, function(err, res){
                   var road = JSON.parse(res);
        
                    if (road.data.attributes.last_analysis_results.Kaspersky.result != "clean") {
                       
                

                        console.log(" nooot    safffffeee")
    
                        //step.context.sendActivity({text: "Your resualt: ",attachments:[CardFactory.adaptiveCard(CARDS [1])]});
                        
                        
                    }
                    else{

                       
                        console.log("safffffeee")
                        
                        //step.context.sendActivity({text: "Your resualt: ",attachments:[CardFactory.adaptiveCard(CARDS [0])]});
                      
                    }
                   
                }); 
            
    
            
    
        })
            



    }





         conversationData.endDialog = await this.makeSeccurityDialogs.isDialogComplete(); //
        if(conversationData.endDialog){
            await this.previusIntent.set(context,{intentName: null});
            await this.sendSuggestedActions(context);
        }
        break;

        case 'IP_LOOKUP': //to be implemented
        console.log("Inside ip");
        await this.conversationData.set(context,{endDialog: false});

        await this.ipSeccurityDialogs.run(context,this.dialogState);
        conversationData.endDialog = await this.ipSeccurityDialogs.isDialogComplete();

        if(conversationData.endDialog){
            await this.previusIntent.set(context,{intentName: null});
            await this.sendSuggestedActions(context);
        }
        break;

        default:
            console.log("Did not match IP_LOOKUP.")
            break;



    }
}

}

module.exports.EchoBot = EchoBot;
