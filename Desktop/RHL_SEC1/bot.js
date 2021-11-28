// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, MessageFactory } = require('botbuilder');
const { MakeSecurityDialogs } = require('./componentDialogs/makeSecurityDialogs');
const { CancelSecurityDialog} = require('./componentDialogs/cancelSecurityDialog');
const {LuisRecognizer}  = require('botbuilder-ai');


//checking git here 
class EchoBot extends ActivityHandler {
    constructor(conversationState,userState) {
        super();
        this.conversationState = conversationState;
        this.userState = userState;
        this.dialogState = conversationState.createProperty("dialogState");
        this.makeSeccurityDialogs = new MakeSecurityDialogs(this.conversationState,this.userState);
        this.cancelSecurityDialog = new CancelSecurityDialog(this.conversationState,this.userState);
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
        this.onMessage(async (context, next) => {


            const luisResult = await dispatchRecognizer.recognize(context)
            const intent = LuisRecognizer.topIntent(luisResult); 
            const entities = luisResult.entities;
            await this.dispatchToIntent(context ,intent);
            console.log(luisResult)

             await next();
        });
        this.onDialog(async (context, next) => {
            // Save any state changes. The load happened during the execution of the Dialog.
            await this.conversationState.saveChanges(context, false);
            await this.userState.saveChanges(context, false);
            await next();
        });
        this.onMembersAdded(async (context, next) => {
           
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
    async sendSuggestedActions(turnContext) {
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
        console.log("Inside URL look up");
        await this.conversationData.set(context,{endDialog: false});

        await this.makeSeccurityDialogs.run(context,this.dialogState ,entities  );
         conversationData.endDialog = await this.makeSeccurityDialogs.isDialogComplete(); //
        if(conversationData.endDialog){
            await this.previusIntent.set(context,{intentName: null});
            await this.sendSuggestedActions(context);
        }
        break;

        case 'cancel_service':
        console.log("Inside cancel");
        await this.conversationData.set(context,{endDialog: false});

        await this.cancelSeccurityDialogs.run(context,this.dialogState);
        conversationData.endDialog = await this.cancelSeccurityDialogs.isDialogComplete();

        if(conversationData.endDialog){
            await this.previusIntent.set(context,{intentName: null});
            await this.sendSuggestedActions(context);
        }
        break;

        default:
            console.log("Did not match UrlLookup.")
            break;



    }
}

}

module.exports.EchoBot = EchoBot;
