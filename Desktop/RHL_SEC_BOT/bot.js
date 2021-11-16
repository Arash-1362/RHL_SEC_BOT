// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, MessageFactory } = require('botbuilder');
const { MakeSecurityDialogs } = require('./componentDialogs/makeSecurityDialogs');
const { CancelSecurityDialog} = require('./componentDialogs/cancelSecurityDialog');


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
    

        


      //  See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        this.onMessage(async (context, next) => {

            await this.dispatchToIntent(context);
        
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
    async dispatchToIntent(context){
          var currentIntent = '';   
          const previusIntent = await this.previusIntent.get(context,{});
          const conversationData = await this.conversationData.get(context,{});

        if(previusIntent.intentName && conversationData.endDialog === false ) {
            currentIntent = previusIntent.intentName;

        }
        else if ((previusIntent.intentName && conversationData.endDialog === true)){
            currentIntent = context.activity.text;

        }
        else{
            currentIntent = context.activity.text;
            await this.previusIntent.set(context,{intentName:context.activity.text});

        }
      
        switch(currentIntent)
    {
        case 'UrlLookup':
        console.log("Inside URL look up");
        await this.conversationData.set(context,{endDialog: false});

        // console.log("Inside Make Reservation Case");
        await this.makeSeccurityDialogs.run(context,this.dialogState);
        conversationData.endDialog = await this.makeSeccurityDialogs.isDialogComplete();
        if(conversationData.endDialog){
            await this.sendSuggestedActions(context);
        }
        break;

        case 'cancel service':
        console.log("Inside cancel");
        await this.conversationData.set(context,{endDialog: false});

        // console.log("Inside Make Reservation Case");
        await this.cancelSeccurityDialogs.run(context,this.dialogState);
        conversationData.endDialog = await this.cancelSeccurityDialogs.isDialogComplete();

        if(conversationData.endDialog){
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
